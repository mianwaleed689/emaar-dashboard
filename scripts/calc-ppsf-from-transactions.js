const admin=require("firebase-admin");
const sa=require("../serviceAccountKey.json");
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();

function median(arr){
  if(!arr.length)return 0;
  const s=[...arr].sort((a,b)=>a-b);
  const m=Math.floor(s.length/2);
  return s.length%2?s[m]:Math.round((s[m-1]+s[m])/2);
}
function percentile(arr,p){
  if(!arr.length)return 0;
  const s=[...arr].sort((a,b)=>a-b);
  const i=Math.floor((p/100)*s.length);
  return s[Math.min(i,s.length-1)];
}

async function main(){
  console.log("Loading all transactions...");
  const txSnap=await db.collection("transactions").get();
  console.log("Total transactions:",txSnap.size);

  // Group by masterProject - only Sales + Residential + 2022+
  const byComm={};
  const byProjNum={};
  let used=0;

  txSnap.docs.forEach(d=>{
    const t=d.data();
    if(t.transGroup!=="Sales") return;
    if(t.propertyUsage&&!t.propertyUsage.includes("Residential")) return;
    if(!t.ppsf||t.ppsf<=0) return;
    if(!t.date||t.date<"2022-01-01") return;
    const ppsf=Math.round(t.ppsf/10.764); // already AED/sqft per handoff rules
    used++;

    // Community level
    const comm=t.masterProject||t.areaName||"";
    if(comm){
      if(!byComm[comm])byComm[comm]=[];
      byComm[comm].push(ppsf);
    }

    // Project level
    const pnum=t.projectNumber;
    if(pnum){
      if(!byProjNum[pnum])byProjNum[pnum]=[];
      byProjNum[pnum].push(ppsf);
    }
  });

  console.log("Transactions used (Sales+Residential+2022+):",used);
  console.log("Communities with data:",Object.keys(byComm).length);
  console.log("Projects with data:",Object.keys(byProjNum).length);

  // Build community stats
  const commStats={};
  Object.entries(byComm).forEach(([comm,arr])=>{
    commStats[comm]={
      median:median(arr),
      p25:percentile(arr,25),
      p75:percentile(arr,75),
      count:arr.length,
    };
  });

  // Build project stats
  const projStats={};
  Object.entries(byProjNum).forEach(([num,arr])=>{
    if(arr.length>=3){ // min 3 transactions for reliability
      projStats[num]={
        median:median(arr),
        p25:percentile(arr,25),
        p75:percentile(arr,75),
        count:arr.length,
      };
    }
  });

  console.log("\nTop communities by transaction count:");
  Object.entries(commStats).sort((a,b)=>b[1].count-a[1].count).slice(0,15).forEach(([c,s])=>{
    console.log("  "+s.count+" tx | AED "+s.median+"/sqft | "+c);
  });

  // Load all projects
  console.log("\nLoading projects...");
  const projSnap=await db.collection("projects").get();
  console.log("Total projects:",projSnap.size);

  let updated=0;
  let byProject=0;
  let byCommunity=0;
  let noData=0;
  let batch=db.batch();
  let bc=0;

  for(const doc of projSnap.docs){
    const p=doc.data();
    const updates={};

    // Try project-level match first (most accurate)
    const pnum=p.projectNumber||p.reraNo||p.dldProjectNumber;
    if(pnum&&projStats[pnum]){
      const s=projStats[pnum];
      updates.ppsf=s.median;
      updates.ppsfP25=s.p25;
      updates.ppsfP75=s.p75;
      updates.ppsfTxCount=s.count;
      updates.ppsfSource="dld-transactions-project";
      updates.ppsfUpdatedAt=new Date().toISOString();
      byProject++;
    } else {
      // Fall back to community median
      const comm=p.masterProject||p.community||p.area||"";
      if(comm&&commStats[comm]){
        const s=commStats[comm];
        updates.communityMedianPPSF=s.median;
        updates.communityP25PPSF=s.p25;
        updates.communityP75PPSF=s.p75;
        updates.communityTxCount=s.count;
        updates.communityPPSFSource="dld-transactions";
        updates.communityPPSFUpdatedAt=new Date().toISOString();
        byCommunity++;
      } else {
        noData++;
      }
    }

    if(Object.keys(updates).length>0){
      batch.update(doc.ref,updates);
      bc++;
      updated++;
      if(bc>=400){
        await batch.commit();
        batch=db.batch();
        bc=0;
        console.log("Committed batch, updated so far:",updated);
      }
    }
  }

  if(bc>0)await batch.commit();

  console.log("\n=== DONE ===");
  console.log("Total updated:",updated);
  console.log("Project-level PPSF (most accurate):",byProject);
  console.log("Community-level PPSF (benchmark):",byCommunity);
  console.log("No transaction data:",noData);
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});
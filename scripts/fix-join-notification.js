var fs=require("fs");
var c=fs.readFileSync("src/pages/JoinPage.jsx","utf8");

// Fix 1: add missing imports
var o1="import { doc, getDoc, setDoc, updateDoc } from \"firebase/firestore\";";
var n1="import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from \"firebase/firestore\";";
if(!c.includes(o1)){console.log("ERROR: import line not found");process.exit(1);}
c=c.replace(o1,n1);

// Fix 2: add notification after invite marked used
var o2="      await updateDoc(doc(db, \"invites\", token), {\n        used: true, usedAt: new Date().toISOString(), agentUid: uid\n      });";
var n2="      await updateDoc(doc(db, \"invites\", token), {\n        used: true, usedAt: new Date().toISOString(), agentUid: uid\n      });\n      // Notify org owner(s) that agent has joined\n      try {\n        const ownerSnap = await getDocs(query(collection(db,\"users\"),where(\"orgId\",\"==\",invite.orgId),where(\"orgRole\",\"==\",\"owner\")));\n        const today=new Date().toISOString().split(\"T\")[0];\n        const notifBatch=[];\n        ownerSnap.forEach(ownerDoc=>{\n          const docId=\"agent_join_\"+uid+\"_\"+ownerDoc.id;\n          notifBatch.push(setDoc(doc(db,\"notifications\",docId),{\n            type:\"agent_joined\",\n            icon:\"👤\",\n            title:name.trim()+\" has joined \"+invite.orgName,\n            body:\"New agent account created. They can now receive and manage leads.\",\n            userId:ownerDoc.id,\n            orgId:invite.orgId,\n            agentUid:uid,\n            agentName:name.trim(),\n            agentEmail:invite.email,\n            read:false,\n            createdAt:new Date().toISOString(),\n            date:today,\n            source:\"agent-join\",\n            priority:\"normal\",\n          }));\n        });\n        await Promise.all(notifBatch);\n      } catch(notifErr){ console.warn(\"Could not send join notification:\",notifErr); }";
if(!c.includes(o2)){console.log("ERROR: updateDoc line not found");process.exit(1);}
c=c.replace(o2,n2);

fs.writeFileSync("src/pages/JoinPage.jsx",c,"utf8");
console.log("Done - agent join notification added");
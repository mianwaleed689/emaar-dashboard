const fs = require('fs');
const c = fs.readFileSync('src/tabs/ProjectsTab.jsx', 'utf8');
const rows = c.split('\n');
const S = String.fromCharCode(36);
const q = String.fromCharCode(34);
const bt = String.fromCharCode(96);
const content = [
'      {projDetailTab === ' + q + 'dldSales' + q + ' && (() => {',
'        const community = selectedProject.masterProject || selectedProject.community || ' + q + q + ';',
'        const [dldTx, setDldTx] = React.useState([]);',
'        const [loading, setLoading] = React.useState(true);',
'        React.useEffect(() => {',
'          if (!community) { setLoading(false); return; }',
'          import(' + q + ' firebase/firestore' + q + ').then(({ collection, query, where, orderBy, limit, getDocs, getFirestore }) => {',
'            const db = getFirestore();',
'            const q2 = query(collection(db, ' + q + 'transactions' + q + '), where(' + q + 'masterProject' + q + ', ' + q + '==' + q + ', community), where(' + q + 'transGroup' + q + ', ' + q + '==' + q + ', ' + q + 'Sales' + q + '), orderBy(' + q + 'date' + q + ', ' + q + 'desc' + q + '), limit(10));',
'            getDocs(q2).then(snap => {',
'              setDldTx(snap.docs.map(d => d.data()));',
'              setLoading(false);',
'            }).catch(() => setLoading(false));',
'          });',
'        }, [community]);',
'        return (',
'          React.createElement(' + q + 'div' + q + ', null,',
'            React.createElement(' + q + 'div' + q + ', {style:{padding:'+ q +'14px 20px'+q+',background:'+ q +'rgba(212,168,67,0.05)'+q+',border:'+ q +'1px solid rgba(212,168,67,0.15)'+q+',borderRadius:10,marginBottom:16}},',
'              React.createElement(' + q + 'div' + q + ', {style:{fontSize:11,color:T.gold,fontWeight:700,letterSpacing:0.5}}, ' + q + 'COMPARABLE SALES · DLD REGISTERED' + q + '),',
'              React.createElement(' + q + 'div' + q + ', {style:{fontSize:11,color:T.textMuted,marginTop:3}}, community)',
'            ),',
'            loading && React.createElement(' + q + 'div' + q + ', {style:{color:T.textMuted,fontSize:12,padding:20}}, ' + q + 'Loading transactions...' + q + '),',
'            !loading && dldTx.length === 0 && React.createElement(' + q + 'div' + q + ', {style:{color:T.textMuted,fontSize:12,padding:20}}, ' + q + 'No DLD transactions found for this project' + q + '),',
'            !loading && dldTx.length > 0 && React.createElement(' + q + 'div' + q + ', {style:{background:'+ q +'rgba(255,255,255,0.02)'+q+',border:'+ q +'1px solid '+q+'+T.border,borderRadius:10,overflow:'+ q +'hidden'+q+'}},',
'              React.createElement(' + q + 'div' + q + ', {style:{display:'+ q +'grid'+q+',gridTemplateColumns:'+ q +'1fr 1fr 1fr 1fr 1fr'+q+',padding:'+ q +'8px 14px'+q+',background:'+ q +'rgba(255,255,255,0.03)'+q+',borderBottom:'+ q +'1px solid '+q+'+T.border}},',
'              ...['+ q +'Date'+q+','+ q +'Price'+q+','+ q +'PPSF'+q+','+ q +'Beds'+q+','+ q +'Type'+q+'].map(h => React.createElement(' + q + 'div' + q + ', {style:{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:'+ q +'uppercase'+q+',letterSpacing:0.8}}, h))',
'            ),',
'            ...dldTx.map((tx,i) => React.createElement(' + q + 'div' + q + ', {key:i,style:{display:'+ q +'grid'+q+',gridTemplateColumns:'+ q +'1fr 1fr 1fr 1fr 1fr'+q+',padding:'+ q +'10px 14px'+q+',borderBottom:i<dldTx.length-1?'+ q +'1px solid rgba(255,255,255,0.04)'+q+':'+ q +'none'+q+'}},',
'              React.createElement(' + q + 'div' + q + ', {style:{fontSize:11,color:T.textSecondary}}, tx.date ? tx.date.substring(0,10) : ' + q + q + '),',
'              React.createElement(' + q + 'div' + q + ', {style:{fontSize:11,fontWeight:700,color:T.gold}}, tx.price ? ' + q + 'AED ' + q + '+(tx.price/1000000).toFixed(2)+' + q + 'M' + q + ' : ' + q + q + '),',
'              React.createElement(' + q + 'div' + q + ', {style:{fontSize:11,color:T.textSecondary}}, tx.ppsf ? ' + q + 'AED ' + q + '+Math.round(tx.ppsf/10.764).toLocaleString() : ' + q + q + '),',
'              React.createElement(' + q + 'div' + q + ', {style:{fontSize:11,color:T.textSecondary}}, tx.rooms || ' + q + q + '),',
'              React.createElement(' + q + 'div' + q + ', {style:{fontSize:11,color:T.textSecondary}}, tx.propertySubType || ' + q + q + ')',
'            ))',
'          ))',
'        );',
'      })()} ',
].join('\n');
const insertAfter = rows.findIndex(l => l.includes('projDetailTab === ' + String.fromCharCode(34) + 'report' + String.fromCharCode(34)));
console.log('inserting before line:', insertAfter+1);
rows.splice(insertAfter, 0, ...content);
fs.writeFileSync('src/tabs/ProjectsTab.jsx', rows.join('\n'), 'utf8');
console.log('Done - DLD Sales tab inserted');
const fs = require('fs');
let c = fs.readFileSync('src/tabs/TeamTab.jsx', 'utf8');
const lines = c.split('\n');

// Add showInvite state
const stateIdx = lines.findIndex(l => l.includes('const [showCreate'));
lines.splice(stateIdx + 1, 0, '  const [showInvite, setShowInvite] = useState(false);');

// Find Add Agent button and add Invite button after it
const addAgentIdx = lines.findIndex((l, i) => i > 260 && l.includes('Add Agent') && !l.includes('Leads'));
console.log('Add Agent line:', addAgentIdx + 1);

// Find closing button tag
let btnEnd = addAgentIdx;
while (btnEnd < addAgentIdx + 6 && !lines[btnEnd].includes('</button>')) btnEnd++;
console.log('Button ends at:', btnEnd + 1);

const inviteBtn = `        <button type="button" onClick={()=>{setShowInvite(true);setInviteLink("");setInviteEmail("");}}
          style={{padding:"8px 16px",borderRadius:7,border:"1px solid "+T.teal,background:"rgba(0,191,165,0.08)",color:T.teal,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
          \u2709 Invite via Link
        </button>`;

lines.splice(btnEnd + 1, 0, inviteBtn);

// Add invite modal before the closing of the component
const showCreateIdx = lines.findIndex((l, i) => i > 400 && l.includes('{showCreate&&('));
console.log('showCreate modal at:', showCreateIdx + 1);

const inviteModal = `      {showInvite&&(
        <div style={{position:"fixed",inset:0,background:"rgba(4,9,15,0.85)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#0A1628",borderRadius:16,padding:32,width:"100%",maxWidth:420,border:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:900,color:"#FFFFFF",marginBottom:4}}>\u2709 Invite Agent</div>
            <div style={{fontSize:12,color:"#64748B",marginBottom:20}}>Generate a secure invite link to send via WhatsApp or email</div>
            {!inviteLink?(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <div style={{fontSize:11,color:"#64748B",marginBottom:6}}>AGENT EMAIL *</div>
                  <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}
                    placeholder="agent@agency.ae"
                    style={{width:"100%",padding:"11px 14px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(212,168,67,0.15)",borderRadius:9,color:"#FFFFFF",fontSize:13,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"}} />
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button type="button" onClick={generateInvite} disabled={sendingInvite}
                    style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#D4A843,#B8922A)",border:"none",borderRadius:9,color:"#000",fontSize:13,fontWeight:700,cursor:sendingInvite?"not-allowed":"pointer"}}>
                    {sendingInvite?"Generating...":"Generate Invite Link"}
                  </button>
                  <button type="button" onClick={()=>setShowInvite(false)}
                    style={{padding:"11px 16px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:9,color:"#94A3B8",fontSize:13,cursor:"pointer"}}>
                    Cancel
                  </button>
                </div>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,padding:"12px 14px"}}>
                  <div style={{fontSize:11,color:"#10B981",fontWeight:700,marginBottom:6}}>\u2705 Invite Link Generated!</div>
                  <div style={{fontSize:11,color:"#94A3B8",wordBreak:"break-all"}}>{inviteLink}</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button type="button" onClick={()=>{navigator.clipboard.writeText(inviteLink);notify("Link copied!");}}
                    style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#D4A843,#B8922A)",border:"none",borderRadius:9,color:"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                    \uD83D\uDCCB Copy Link
                  </button>
                  <button type="button" onClick={()=>window.open("https://wa.me/?text="+encodeURIComponent("You have been invited to join "+orgName+". Click here to create your account: "+inviteLink),"_blank")}
                    style={{flex:1,padding:"11px",background:"rgba(37,211,102,0.12)",border:"1px solid rgba(37,211,102,0.3)",borderRadius:9,color:"#25D366",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                    \uD83D\uDCF1 Send via WhatsApp
                  </button>
                </div>
                <button type="button" onClick={()=>setShowInvite(false)}
                  style={{padding:"10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:9,color:"#94A3B8",fontSize:12,cursor:"pointer"}}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}`;

lines.splice(showCreateIdx, 0, inviteModal);

fs.writeFileSync('src/tabs/TeamTab.jsx', lines.join('\n'), 'utf8');
console.log('Done. Has showInvite:', c.includes('showInvite') || lines.join('\n').includes('showInvite'));
console.log('Has inviteModal:', lines.join('\n').includes('Invite via Link'));

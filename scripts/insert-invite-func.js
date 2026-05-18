const fs = require('fs');
let c = fs.readFileSync('src/tabs/TeamTab.jsx', 'utf8');

const idx = c.indexOf('Create agent account');
const insertAt = c.lastIndexOf('\n', idx) + 1;

const func = `  const generateInvite = async () => {
    if (!inviteEmail.trim()) { notify("Please enter agent email", "error"); return; }
    setSendingInvite(true);
    try {
      const token = "inv_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date(Date.now() + 7*24*60*60*1000).toISOString();
      const { setDoc, doc: fsDoc } = await import("firebase/firestore");
      await setDoc(fsDoc(db, "invites", token), {
        token, email: inviteEmail.trim(),
        orgId: orgId || "", orgName: orgName || "Your Agency",
        managerId: firebaseUser?.uid || "",
        createdAt: new Date().toISOString(),
        expiresAt, used: false,
      });
      const link = window.location.origin + "/join?token=" + token;
      setInviteLink(link);
      notify("Invite link generated!");
    } catch(e) { notify("Failed: " + e.message, "error"); }
    setSendingInvite(false);
  };

`;

c = c.substring(0, insertAt) + func + c.substring(insertAt);
fs.writeFileSync('src/tabs/TeamTab.jsx', c, 'utf8');
console.log('Done. Has generateInvite:', c.includes('generateInvite'));

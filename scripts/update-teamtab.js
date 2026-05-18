const fs = require('fs');
const q = '"';

let c = fs.readFileSync('src/tabs/TeamTab.jsx', 'utf8');

// Add doc import for invites
c = c.replace(
  "import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from \"firebase/auth\";",
  "import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from \"firebase/auth\";"
);

// Add setDoc to firestore imports if not there
if (!c.includes('setDoc')) {
  c = c.replace(
    "import { doc, setDoc, updateDoc, collection, query, where, getDocs, arrayUnion } from \"firebase/firestore\";",
    "import { doc, setDoc, updateDoc, collection, query, where, getDocs, arrayUnion, addDoc } from \"firebase/firestore\";"
  );
}

// Add invite state after existing state declarations
c = c.replace(
  'const [form, setForm] = useState({name:"",email:"",phone:"",password:"",nationality:""});',
  'const [form, setForm] = useState({name:"",email:"",phone:"",password:"",nationality:""});\n  const [inviteMode, setInviteMode] = useState(false);\n  const [inviteEmail, setInviteEmail] = useState("");\n  const [inviteLink, setInviteLink] = useState("");\n  const [sendingInvite, setSendingInvite] = useState(false);'
);

// Add generateInvite function before createAgent
const generateInviteFunc = `
// Generate invite link
const generateInvite = async () => {
  if (!inviteEmail.trim()) { notify("Please enter agent email", "error"); return; }
  setSendingInvite(true);
  try {
    const token = "inv_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    await setDoc(doc(db, "invites", token), {
      token, email: inviteEmail.trim(),
      orgId: orgId || "",
      orgName: orgName || "Your Agency",
      managerId: firebaseUser?.uid || "",
      managerName: firebaseUser?.displayName || firebaseUser?.email || "",
      createdAt: new Date().toISOString(),
      expiresAt, used: false,
    });
    const link = window.location.origin + "/join?token=" + token;
    setInviteLink(link);
    notify("Invite link generated!");
  } catch(e) {
    notify("Failed to generate invite: " + e.message, "error");
  }
  setSendingInvite(false);
};

`;

c = c.replace('// Create agent account', generateInviteFunc + '// Create agent account');

fs.writeFileSync('src/tabs/TeamTab.jsx', c, 'utf8');
console.log('TeamTab updated. Has generateInvite:', c.includes('generateInvite'));
console.log('Has inviteLink:', c.includes('inviteLink'));

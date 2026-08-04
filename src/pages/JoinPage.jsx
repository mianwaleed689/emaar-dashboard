import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

const T = {
  bg: "#04090F", surface: "#0A1628", gold: "#D4A843",
  white: "#FFFFFF", textMuted: "#64748B",
  border: "rgba(255,255,255,0.06)", red: "#EF4444", green: "#10B981"
};

export default function JoinPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [joining, setJoining] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setError("Invalid invite link"); setLoading(false); return; }
    getDoc(doc(db, "invites", token)).then(snap => {
      if (!snap.exists()) { setError("Invite not found or expired"); setLoading(false); return; }
      const d = snap.data();
      if (d.used) { setError("This invite has already been used"); setLoading(false); return; }
      if (d.expiresAt && new Date(d.expiresAt) < new Date()) { setError("This invite has expired"); setLoading(false); return; }
      setInvite(d);
      setLoading(false);
    }).catch(() => { setError("Failed to load invite"); setLoading(false); });
  }, [token]);

  const handleJoin = async () => {
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setJoining(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, invite.email, password);
      const uid = cred.user.uid;
      await setDoc(doc(db, "users", uid), {
        name: name.trim(), email: invite.email,
        role: "user", orgRole: "agent", orgId: invite.orgId,
        managerId: invite.managerId, status: "active",
        /* `tier: "free"` was written here for somebody joining a PAYING
           agency, which was simply untrue. Entitlement now comes from the
           organisation, so this records no tier rather than a wrong one. */
        paid: true,
        onboardingComplete: false,
        createdAt: new Date().toISOString(),
        createdBy: invite.managerId,
      });
      if(invite.orgId) await setDoc(doc(db, "organisations", invite.orgId, "members", uid), {
        uid, name: name.trim(), email: invite.email,
        orgRole: "agent", orgId: invite.orgId,
        managerId: invite.managerId, status: "active",
        createdAt: new Date().toISOString(),
      }, { merge: true });
      await updateDoc(doc(db, "invites", token), {
        used: true, usedAt: new Date().toISOString(), agentUid: uid
      });

      /* Take the seat.
         seatsUsed and agentCount were written at signup and then never moved, so
         the seat check on the invite screen would have compared against a number
         frozen at 1 forever. increment() rather than a read-then-write because
         two agents accepting invites at the same moment would otherwise both
         read the same value and one of the seats would go unrecorded. */
      if (invite.orgId) {
        try {
          const { increment } = await import("firebase/firestore");
          await updateDoc(doc(db, "organisations", invite.orgId), {
            seatsUsed: increment(1),
            agentCount: increment(1),
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {
          /* The agent is already created and in the org; a failed counter must
             not block them getting in. Logged so the discrepancy is findable. */
          console.error("Seat counter not incremented for org " + invite.orgId, e);
        }
      }
      // Notify org owner(s) that agent has joined
      try {
        const ownerSnap = await getDocs(query(collection(db,"users"),where("orgId","==",invite.orgId),where("orgRole","==","owner")));
        const today=new Date().toISOString().split("T")[0];
        const notifBatch=[];
        ownerSnap.forEach(ownerDoc=>{
          const docId="agent_join_"+uid+"_"+ownerDoc.id;
          notifBatch.push(setDoc(doc(db,"notifications",docId),{
            type:"agent_joined",
            icon:"👤",
            title:name.trim()+" has joined "+invite.orgName,
            body:"New agent account created. They can now receive and manage leads.",
            userId:ownerDoc.id,
            orgId:invite.orgId,
            agentUid:uid,
            agentName:name.trim(),
            agentEmail:invite.email,
            read:false,
            createdAt:new Date().toISOString(),
            date:today,
            source:"agent-join",
            priority:"normal",
          }));
        });
        await Promise.all(notifBatch);
      } catch(notifErr){ console.warn("Could not send join notification:",notifErr); }
      setDone(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch(e) {
      if (e.code === "auth/email-already-in-use") setError("This email is already registered. Please log in.");
      else setError(e.message);
      setJoining(false);
    }
  };

  const inp = {
    width: "100%", padding: "11px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(212,168,67,0.15)",
    borderRadius: 9, color: T.white, fontSize: 13,
    fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box"
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", color: T.gold }}>
      Loading invite...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: T.surface, borderRadius: 16, padding: 40, width: "100%", maxWidth: 440, border: "1px solid " + T.border }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.gold }}>
            {done ? "Welcome aboard!" : invite ? "Join " + invite.orgName : "Invalid Invite"}
          </div>
          {invite && !done && (
            <div style={{ fontSize: 13, color: T.textMuted, marginTop: 6 }}>
              You have been invited to join <strong style={{ color: T.white }}>{invite.orgName}</strong>
            </div>
          )}
        </div>
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", color: T.red, fontSize: 12, marginBottom: 16 }}>
            {error}
          </div>
        )}
        {done && (
          <div style={{ textAlign: "center", color: T.green, fontSize: 14 }}>
            ✅ Account created! Redirecting to dashboard...
          </div>
        )}
        {!done && invite && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>EMAIL</div>
              <div style={{ ...inp, opacity: 0.6 }}>{invite.email}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>YOUR NAME *</div>
              <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>PASSWORD *</div>
              <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>CONFIRM PASSWORD *</div>
              <input style={inp} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" />
            </div>
            <button type="button" onClick={handleJoin} disabled={joining}
              style={{ padding: 13, background: "linear-gradient(135deg,#D4A843,#B8922A)", border: "none", borderRadius: 10, color: "#000", fontSize: 14, fontWeight: 700, cursor: joining ? "not-allowed" : "pointer", opacity: joining ? 0.7 : 1 }}>
              {joining ? "Creating account..." : "Join " + invite.orgName}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

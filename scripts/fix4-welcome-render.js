const fs = require("fs");
let content = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

const oldCheck = `  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => {}} onBack={() => setShowLogin(false)} defaultMode={showLogin === "signup" ? "signup" : "login"} />;
  }`;

const newCheck = `  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => {}} onBack={() => setShowLogin(false)} defaultMode={showLogin === "signup" ? "signup" : "login"} />;
  }

  // Welcome screen — first login only for agents
  if (showWelcome) {
    return (
      <WelcomeScreen
        userName={userName}
        orgName={orgProfile?.name || ""}
        managerName={managerName}
        userId={firebaseUser?.uid}
        onDismiss={() => setShowWelcome(false)}
      />
    );
  }`;

if (content.includes(oldCheck)) {
  content = content.replace(oldCheck, newCheck);
  console.log("FIX 4 done — WelcomeScreen render added after login check");
} else {
  console.log("Pattern not found");
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", content, "latin1");
console.log("Written");
const fs = require("fs");
let rules = fs.readFileSync("firestore.rules", "utf8");

// Add neighbourhoodScores rule after communityROI
rules = rules.replace(
  `match /communityROI/{doc}     { allow read: if isAuthed(); allow write: if isAdmin(); }`,
  `match /communityROI/{doc}     { allow read: if isAuthed(); allow write: if isAdmin(); }
    match /neighbourhoodScores/{doc} { allow read: if isAuthed(); allow write: if isAdmin(); }`
);

fs.writeFileSync("firestore.rules", rules, "utf8");
console.log("Rule added for neighbourhoodScores");
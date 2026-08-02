// Dump the repo's community registry to JSON: id, name, developer, area, coordinates.
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const DIR = "C:/Users/TAD/emaar-dashboard/src/communities/";
const FILES = {
  emaar: "emaar.communities.js",
  damac: "damac.communities.js",
  sobha: "sobha.communities.js",
  nakheel: "nakheel.communities.js",
  meraas: "meraas.communities.js",
  aldar: "aldar.communities.js",
  binghatti: "binghatti.communities.js",
};

const out = [];
for (const [dev, file] of Object.entries(FILES)) {
  let mod;
  try {
    mod = await import(pathToFileURL(DIR + file).href);
  } catch (e) {
    console.error(`FAILED ${file}: ${e.message}`);
    continue;
  }
  const arr = Object.entries(mod).find(([k, v]) => Array.isArray(v) && k.toLowerCase().includes("communit"));
  if (!arr) { console.error(`no community array in ${file}: ${Object.keys(mod)}`); continue; }
  console.error(`${dev}: ${arr[1].length} from ${arr[0]}`);
  for (const c of arr[1]) {
    out.push({
      id: c.id,
      name: c.name,
      developer: c.developer ?? dev,
      emirate: c.emirate ?? null,
      sourceFile: file,
      area: c.location?.area ?? null,
      lat: c.location?.coordinates?.lat ?? null,
      lng: c.location?.coordinates?.lng ?? null,
    });
  }
}
writeFileSync(process.argv[2], JSON.stringify(out, null, 1), "utf8");
console.error(`\ntotal: ${out.length} communities -> ${process.argv[2]}`);

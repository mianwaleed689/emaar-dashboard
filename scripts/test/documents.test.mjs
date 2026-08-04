/**
 * DOCUMENTS — the paperwork behind the gate.
 *
 * The claim being tested is the product's central one: a deal cannot pass a
 * stage until the paperwork is on file. A gate you can pass by asserting is
 * worse than no gate, so most of this is about telling a FILE apart from a
 * TICK, and about refusing files that should never be attached at all.
 *
 *     node scripts/test/documents.test.mjs
 */
import { checkFile, documentRecord, isOnFile, isTicked, documentState,
         documentAudit, evidenceCoverage, humanSize, MAX_FILE_BYTES, ACCEPTED }
  from "../../src/crm/model/documents.js";

let pass = 0, fail = 0;
const ok = (n, c, got) => {
  if (c) { pass++; console.log(`  ✓ ${n}`); }
  else { fail++; console.log(`  ✗ ${n}${got !== undefined ? `  →  ${JSON.stringify(got)}` : ""}`); }
};
const head = t => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 58 - t.length))}`);

const file = (name, type, size) => ({ name, type, size });
const MB = 1024 * 1024;

/* ── WHAT MAY BE ATTACHED ─────────────────────────────────────────────────── */
head("A CRM THAT ACCEPTS AN .EXE AS A TITLE DEED");

ok("a PDF is accepted",  checkFile(file("formA.pdf", "application/pdf", 300000)).ok);
ok("a photograph is accepted", checkFile(file("noc.jpg", "image/jpeg", 2 * MB)).ok);
ok("a HEIC from an iPhone is accepted", checkFile(file("deed.heic", "image/heic", 3 * MB)).ok);

const exe = checkFile(file("titledeed.pdf.exe", "application/x-msdownload", 900));
ok("an executable is refused", exe.ok === false, exe);
ok("  even named to look like a deed", /PDF or a photograph/.test(exe.reason), exe.reason);

const scr = checkFile(file("x.pdf", "text/html", 500));
ok("html is refused whatever the extension says", checkFile(file("x.pdf", "text/html", 500)).ok === false);
ok("  and the reason names what was actually sent", /text\/html/.test(scr.reason), scr.reason);

const big = checkFile(file("scan.pdf", "application/pdf", 40 * MB));
ok("an oversized scan is refused", big.ok === false);
ok("  and says the size, the limit and what to do",
   /40 MB/.test(big.reason) && /15 MB/.test(big.reason) && /photograph the page/.test(big.reason), big.reason);

ok("an empty file is refused", checkFile(file("a.pdf", "application/pdf", 0)).ok === false);
ok("no file at all is refused", checkFile(null).ok === false);
ok("a file of unknown type says so rather than 'invalid'",
   /unknown type/.test(checkFile(file("a", "", 10)).reason), checkFile(file("a", "", 10)).reason);

/* ── A FILE IS NOT A TICK ─────────────────────────────────────────────────── */
head("TELLING A FILE APART FROM SOMEBODY SAYING SO");

const tickOnly = { receivedAt: "2026-08-01T00:00:00Z", by: "Fatima" };
const filed = documentRecord({ file: file("noc.pdf", "application/pdf", 120000),
                               path: "orgs/o/deals/d/noc/1_noc.pdf", backend: "firebase",
                               by: "Fatima", now: new Date("2026-08-04T09:00:00Z") });

ok("a tick alone is not on file", isOnFile(tickOnly) === false);
ok("a tick alone IS ticked",      isTicked(tickOnly) === true);
ok("an attached file is on file", isOnFile(filed) === true);
ok("  and records the name, size and where it went",
   filed.file.name === "noc.pdf" && filed.file.size === 120000 &&
   filed.file.backend === "firebase" && filed.file.path.includes("orgs/o/deals/d"), filed.file);
ok("  and who attached it, and when", filed.by === "Fatima" && filed.file.uploadedAt.startsWith("2026-08-04"));

/* ── THE GATE ─────────────────────────────────────────────────────────────── */
head("WHAT THE GATE DOES WITH EACH");

ok("a filed document passes, strict or not",
   documentState(filed).passes && documentState(filed, { strict: true }).passes);

ok("a tick passes while strict is off", documentState(tickOnly).passes === true);
ok("  but is reported as having no file",
   /no file is attached/i.test(documentState(tickOnly).note), documentState(tickOnly).note);

const strictTick = documentState(tickOnly, { strict: true });
ok("a tick does NOT pass once strict is on", strictTick.passes === false);
ok("  and says what to do about it", /Attach it to move on/.test(strictTick.note), strictTick.note);

ok("a missing document never passes",
   documentState(undefined).passes === false && documentState(undefined, { strict: true }).passes === false);

/* ── THE WHOLE DEAL ───────────────────────────────────────────────────────── */
head("EVERY REQUIRED DOCUMENT, IN ONE ANSWER");

const deal = { documents: { formA: filed, trakheesi: tickOnly } };
const req  = ["formA", "trakheesi", "noc"];

const loose = documentAudit(deal, req);
ok("with strict off, only the genuinely missing one blocks",
   loose.missing.length === 1 && loose.missing[0] === "noc", loose.missing);
ok("  and the unevidenced tick is still named",
   loose.unevidenced.length === 1 && loose.unevidenced[0] === "trakheesi", loose.unevidenced);
ok("  with a sentence an owner can act on",
   /1 of 3 ticked with no file/.test(loose.evidenceNote), loose.evidenceNote);

const strict = documentAudit(deal, req, { strict: true });
ok("with strict on, the unevidenced tick blocks too",
   strict.missing.length === 2 && strict.missing.includes("trakheesi"), strict.missing);
ok("neither is complete", loose.complete === false && strict.complete === false);

const done = documentAudit({ documents: { formA: filed } }, ["formA"], { strict: true });
ok("a deal with every file attached is complete under strict",
   done.complete === true, done);
ok("  and says so", /Every required document has a file/.test(done.evidenceNote), done.evidenceNote);

ok("a deal with nothing required yet is not reported as broken",
   documentAudit({}, []).evidenceNote === "Nothing required yet.");

/* ── THE NUMBER THAT JUSTIFIES SWITCHING IT ON ────────────────────────────── */
head("HOW MUCH OF WHAT WE CLAIM IS FILED HAS A FILE");

const deals = [
  { documents: { a: filed,    b: tickOnly } },
  { documents: { a: tickOnly, b: tickOnly } },
  { documents: { a: filed,    b: filed } },
];
const cov = evidenceCoverage(deals, () => ["a", "b"]);
ok("six ticks across three deals", cov.ticked === 6, cov);
ok("three of them have files",     cov.filed === 3, cov);
ok("three do not",                 cov.unevidenced === 3);
ok("50 per cent",                  cov.pct === 50, cov.pct);
ok("not ready for strict yet",     cov.ready === false);

const allFiled = evidenceCoverage([{ documents: { a: filed } }], () => ["a"]);
ok("an agency with every file attached is ready", allFiled.ready === true && allFiled.pct === 100);
ok("an agency with no deals is not falsely 'ready'",
   evidenceCoverage([], () => []).ready === false);

/* ── SIZES READ LIKE SIZES ────────────────────────────────────────────────── */
head("HUMAN SIZES");
ok("bytes",     humanSize(900) === "900 B", humanSize(900));
ok("kilobytes", humanSize(300000) === "293 KB", humanSize(300000));
ok("megabytes", humanSize(2.5 * MB) === "2.5 MB", humanSize(2.5 * MB));
ok("the limit prints as 15 MB", humanSize(MAX_FILE_BYTES) === "15 MB", humanSize(MAX_FILE_BYTES));

console.log(`\n${fail ? "✗" : "✓"} documents — ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

function findCookieFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".git" || entry.name === ".next" || entry.name === ".open-next") continue;
      results.push(...findCookieFiles(fullPath));
    } else if (
      (entry.name === "index.js" || entry.name === "index.mjs") &&
      fullPath.includes(`${path.sep}cookie${path.sep}`)
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

const nodeModules = path.join(__dirname, "..", "node_modules");
const cookieFiles = findCookieFiles(nodeModules);

for (const file of cookieFiles) {
  try {
    let content = fs.readFileSync(file, "utf8");
    if (!content.includes("exports.default = exports")) {
      content += `
// Patched for OpenNext / ES module compatibility:
if (typeof exports !== "undefined") {
  exports.default = exports;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = exports;
    module.exports.default = exports;
  }
}
`;
      fs.writeFileSync(file, content);
      console.log(`[patch-cookie] Successfully patched ${path.relative(path.join(__dirname, ".."), file)}`);
    }
  } catch (err) {
    console.warn(`[patch-cookie] Could not patch ${file}:`, err.message);
  }
}

// Patch Next.js base-server.js to surface exact error details when a 500 occurs
const baseServerPath = path.join(nodeModules, "next", "dist", "server", "base-server.js");
if (fs.existsSync(baseServerPath)) {
  try {
    let bsContent = fs.readFileSync(baseServerPath, "utf8");
    bsContent = bsContent.replace(
      "res.body('Internal Server Error').send();",
      "res.body('Internal Server Error: ' + ((err && err.stack) || (err && err.message) || String(err))).send();"
    );
    bsContent = bsContent.replace(
      "_renderresult.default.fromStatic('Internal Server Error', 'text/plain')",
      "_renderresult.default.fromStatic('Internal Server Error: ' + ((error && error.stack) || (error && error.message) || String(error)), 'text/plain')"
    );
    fs.writeFileSync(baseServerPath, bsContent);
    console.log("[patch] Successfully patched base-server.js for detailed error output");
  } catch (err) {
    console.warn("[patch] Could not patch base-server.js:", err.message);
  }
}

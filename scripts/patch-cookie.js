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

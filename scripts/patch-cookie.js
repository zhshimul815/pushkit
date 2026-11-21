/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

function findCookieDistFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === ".git" ||
        entry.name === ".next" ||
        entry.name === ".open-next" ||
        entry.name === "next" // NEVER patch next's internal compiled packages
      ) {
        continue;
      }
      results.push(...findCookieDistFiles(fullPath));
    } else if (
      (entry.name === "index.js" || entry.name === "index.mjs") &&
      fullPath.includes(`${path.sep}cookie${path.sep}dist${path.sep}`)
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

const nodeModules = path.join(__dirname, "..", "node_modules");
const cookieFiles = findCookieDistFiles(nodeModules);

for (const file of cookieFiles) {
  try {
    let content = fs.readFileSync(file, "utf8");
    if (!content.includes("exports.default = exports")) {
      content += `
// Patched for OpenNext / ES module compatibility:
if (typeof exports !== "undefined" && exports.parse) {
  exports.default = exports;
}
`;
      fs.writeFileSync(file, content);
      console.log(`[patch-cookie] Successfully patched ${path.relative(path.join(__dirname, ".."), file)}`);
    }
  } catch (err) {
    console.warn(`[patch-cookie] Could not patch ${file}:`, err.message);
  }
}

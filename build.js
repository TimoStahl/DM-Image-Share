const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src");
const distDir = path.join(__dirname, "dist");
const distFile = path.join(distDir, "share.html");

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

try {
  // Read source files
  let html = fs.readFileSync(path.join(srcDir, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(srcDir, "styles.css"), "utf8");
  const senderJs = fs.readFileSync(path.join(srcDir, "sender.js"), "utf8");
  const receiverJs = fs.readFileSync(path.join(srcDir, "receiver.js"), "utf8");
  const appJs = fs.readFileSync(path.join(srcDir, "app.js"), "utf8");

  // Combine scripts in structural order
  const combinedJs = `
${senderJs}
${receiverJs}
${appJs}
`;

  // Inject CSS and JS into index.html
  html = html.replace(
    "<!-- INJECT_CSS_HERE -->",
    `<style>
${css}
</style>`,
  );
  html = html.replace(
    "<!-- INJECT_JS_HERE -->",
    `<script>
${combinedJs}
</script>`,
  );

  fs.writeFileSync(distFile, html, "utf8");
  console.log("Build completed! Your single file is ready at: dist/share.html");
} catch (error) {
  console.error("Build failed:", error);
}

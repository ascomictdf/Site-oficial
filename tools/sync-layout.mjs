// Copia partials/header.html e partials/footer.html para todas as páginas .html da raiz.
// Uso: node tools/sync-layout.mjs
// Cada página precisa dos marcadores <!-- @header --><!-- /@header --> e <!-- @footer --><!-- /@footer -->.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const parts = {
  header: readFileSync(join(root, "partials/header.html"), "utf8").trim(),
  footer: readFileSync(join(root, "partials/footer.html"), "utf8").trim(),
};

for (const file of readdirSync(root).filter((f) => f.endsWith(".html"))) {
  const path = join(root, file);
  let html = readFileSync(path, "utf8");
  for (const [name, content] of Object.entries(parts)) {
    const re = new RegExp(`<!-- @${name} -->[\\s\\S]*?<!-- /@${name} -->`);
    html = html.replace(re, `<!-- @${name} -->\n${content}\n<!-- /@${name} -->`);
  }
  writeFileSync(path, html);
  console.log("ok", file);
}

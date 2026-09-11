// Mirror the built Pagefind index into `public/` so search also works in `astro dev`.
// A plain `cp -r` would break the build on Windows, hence this script.
import { cpSync, existsSync, rmSync } from "node:fs";

const from = "dist/pagefind";
const to = "public/pagefind";

if (!existsSync(from)) {
  console.error(`[copy-pagefind] ${from} is missing; did pagefind run?`);
  process.exit(1);
}

rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true });
console.log(`[copy-pagefind] ${from} -> ${to}`);

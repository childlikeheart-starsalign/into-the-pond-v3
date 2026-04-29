/**
 * Stage every non-ignored file (same rules as create-git-snapshot) and create a commit.
 * Uses isomorphic-git when system git is unavailable.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ignore from "ignore";
import git from "isomorphic-git";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

async function loadGitignoreRules() {
  try {
    return await fs.promises.readFile(path.join(repoRoot, ".gitignore"), "utf8");
  } catch {
    return "";
  }
}

function posix(rel) {
  return rel.split(path.sep).join("/");
}

function shouldSkipDir(name) {
  return name === ".git";
}

function shouldIgnorePath(relPosix, ig) {
  if (relPosix === "" || relPosix.startsWith(".git")) return true;
  return ig.ignores(relPosix) || ig.ignores(`${relPosix}/`);
}

async function collectTrackedFiles(dirRel, ig, out) {
  const absDir = path.join(repoRoot, dirRel);
  let dirents;
  try {
    dirents = await fs.promises.readdir(absDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const d of dirents) {
    if (shouldSkipDir(d.name)) continue;
    const rel = dirRel ? `${dirRel}/${d.name}` : d.name;
    const relPosix = posix(rel);
    if (shouldIgnorePath(relPosix, ig)) continue;
    if (d.isDirectory()) {
      await collectTrackedFiles(rel, ig, out);
    } else if (d.isFile()) {
      out.push(relPosix);
    }
  }
}

async function main() {
  const message = process.argv.slice(2).join(" ").trim() || "chore: update tracked files";
  const ig = ignore().add(await loadGitignoreRules());
  const files = [];
  await collectTrackedFiles("", ig, files);
  files.sort();

  for (const filepath of files) {
    await git.add({ fs, dir: repoRoot, filepath });
  }

  const author = {
    name: process.env.GIT_AUTHOR_NAME || "Into The Pond snapshot",
    email: process.env.GIT_AUTHOR_EMAIL || "snapshot@local.invalid",
  };

  try {
    const oid = await git.commit({
      fs,
      dir: repoRoot,
      message,
      author,
    });
    console.log(`Committed ${oid}`);
  } catch (e) {
    if (e?.code === "EmptyCommitError" || String(e?.message || "").includes("empty")) {
      console.log("Nothing to commit.");
      process.exit(0);
      return;
    }
    throw e;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

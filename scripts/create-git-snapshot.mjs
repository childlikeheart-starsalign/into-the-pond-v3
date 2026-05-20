/**
 * Creates a local Git repository without relying on the system `git` binary
 * (works when Xcode Command Line Tools are missing).
 *
 * Usage: node scripts/create-git-snapshot.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ignore from "ignore";
import git from "isomorphic-git";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const TAG_NAME = "foundations-v1";
const COMMIT_MESSAGE =
  "chore: initial snapshot — Firebase, RevenueCat, WatermelonDB, Cloud Functions";

const TAG_MESSAGE = `foundations milestone snapshot

Includes:
- Firebase Auth, Firestore, Cloud Functions (IAP verify, diary, well, cast, subscription sync)
- RevenueCat client + server entitlement reconciliation
- WatermelonDB offline cache, lesson_access cache, diary offline queue`;

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
  const gitdir = path.join(repoRoot, ".git");
  if (fs.existsSync(gitdir)) {
    const tags = await git.listTags({ fs, dir: repoRoot });
    if (tags.includes(TAG_NAME)) {
      console.log(`Git repo already initialized and tag '${TAG_NAME}' exists. Nothing to do.`);
      process.exit(0);
      return;
    }
    console.error(
      `Directory '${repoRoot}' has a .git folder but tag '${TAG_NAME}' is missing. Remove .git or fix the repo manually.`,
    );
    process.exit(1);
    return;
  }

  const ig = ignore().add(await loadGitignoreRules());

  const author = {
    name: process.env.GIT_AUTHOR_NAME || "Into The Pond snapshot",
    email: process.env.GIT_AUTHOR_EMAIL || "snapshot@local.invalid",
  };

  await git.init({ fs, dir: repoRoot, defaultBranch: "main" });

  const files = [];
  await collectTrackedFiles("", ig, files);
  files.sort();

  for (const filepath of files) {
    await git.add({ fs, dir: repoRoot, filepath });
  }

  const oid = await git.commit({
    fs,
    dir: repoRoot,
    message: COMMIT_MESSAGE,
    author,
  });

  await git.annotatedTag({
    fs,
    dir: repoRoot,
    ref: TAG_NAME,
    object: oid,
    message: TAG_MESSAGE,
    tagger: author,
  });

  console.log(`Created Git repository at ${repoRoot}`);
  console.log(`Branch: main`);
  console.log(`Commit: ${oid}`);
  console.log(`Annotated tag: ${TAG_NAME}`);
  console.log("");
  console.log("Next — push to GitHub (private repo recommended):");
  console.log("  gh repo create into-the-pond-v3 --private --source=. --remote=origin --push");
  console.log("Or create an empty repo on GitHub, then:");
  console.log("  git remote add origin git@github.com:YOUR_USER/into-the-pond-v3.git");
  console.log("  git push -u origin main");
  console.log(`  git push origin ${TAG_NAME}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

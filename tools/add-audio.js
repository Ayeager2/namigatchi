#!/usr/bin/env node
/**
 * Quick CLI to add a music track or SFX to the audio registry.
 *
 * Usage:
 *   node tools/add-audio.js
 *   npm run add-audio
 *
 * Walks you through:
 *   1. Source URL (Pixabay, FMA, Incompetech, etc.) — used for attribution.
 *   2. Auto-fetches the page to suggest a title (and tries to find a direct
 *      MP3 link to download — works on some hosts, not all).
 *   3. Falls back to asking for a local file path. Drag/drop into the terminal
 *      pastes the path; quotes are stripped automatically.
 *   4. Prompts for id, title, artist, tags (music only), volume, loop.
 *   5. Auto-detects license from the source domain when possible.
 *   6. Copies the file to public/audio/{music|sfx}/ as id.mp3.
 *   7. Appends a properly-formatted entry to src/content/audio.js.
 *
 * The Credits section in Settings auto-renders from audio.js — once this
 * tool finishes, the new track is fully wired in and attributed.
 */

import { promises as fs, existsSync } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const AUDIO_JS = path.join(PROJECT_ROOT, "src/content/audio.js");
const PUBLIC_AUDIO = path.join(PROJECT_ROOT, "public/audio");

// Common source domains and their license info. Used to pre-fill defaults.
const LICENSE_PRESETS = {
  "pixabay.com": { name: "Pixabay Content License", attribution: false },
  "freemusicarchive.org": {
    name: "Creative Commons (check page)",
    attribution: true,
  },
  "incompetech.com": { name: "CC-BY 4.0 (Kevin MacLeod)", attribution: true },
  "freesound.org": {
    name: "Creative Commons (check page)",
    attribution: true,
  },
  "tabletopaudio.com": {
    name: "Tabletop Audio (personal use)",
    attribution: true,
  },
  "uppbeat.io": { name: "Uppbeat (free tier)", attribution: true },
  "bensound.com": { name: "Bensound Free", attribution: true },
};

function detectLicense(url) {
  for (const [domain, preset] of Object.entries(LICENSE_PRESETS)) {
    if (url.includes(domain)) return preset;
  }
  return { name: "Unknown — check the source page", attribution: true };
}

// Try to fetch the page HTML and extract a title (og:title, then <title>).
// Also tries to find a direct MP3 url on the page (works on some hosts).
async function fetchPageInfo(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; namigatchi-dev-tool; +local)",
      },
    });
    if (!res.ok) return { title: null, mp3Url: null };
    const html = await res.text();

    let title = null;
    const og = html.match(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
    );
    if (og) title = og[1];
    if (!title) {
      const t = html.match(/<title>([^<]+)<\/title>/i);
      if (t) title = t[1].trim();
    }
    // Strip common suffixes (" | Site Name").
    if (title) title = title.replace(/\s*[|·\-]\s*[^|·\-]+$/, "").trim();

    // Look for a direct MP3 URL on the page. Many hosts hide the URL behind
    // a session-locked endpoint — for those this returns null and we fall
    // back to the manual file path.
    let mp3Url = null;
    const cdn = html.match(/(https?:\/\/cdn\.pixabay\.com\/[^"'\s]+\.mp3)/i);
    if (cdn) mp3Url = cdn[1];
    if (!mp3Url) {
      const audioSrc = html.match(/<source[^>]+src=["']([^"']+\.mp3[^"']*)["']/i);
      if (audioSrc) mp3Url = audioSrc[1];
    }

    return { title, mp3Url };
  } catch {
    return { title: null, mp3Url: null };
  }
}

// Download a remote URL to a temp file. Returns the temp path.
async function downloadTo(url, tempPath) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(tempPath, buf);
  return tempPath;
}

async function copyFile(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

function escJs(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function formatEntry(kind, m) {
  const lines = [
    `  ${m.id}: {`,
    `    id: "${escJs(m.id)}",`,
    `    title: "${escJs(m.title)}",`,
    `    artist: ${m.artist ? `"${escJs(m.artist)}"` : "null"},`,
    `    file: "${escJs(m.file)}",`,
    `    license: "${escJs(m.license)}",`,
    `    sourceUrl: "${escJs(m.sourceUrl)}",`,
    `    attribution: ${m.attribution},`,
  ];
  if (kind === "music") {
    lines.push(
      `    tags: [${(m.tags || []).map((t) => `"${escJs(t)}"`).join(", ")}],`
    );
    lines.push(`    loop: ${m.loop !== false},`);
  } else {
    lines.push(`    loop: false,`);
  }
  lines.push(`    volume: ${m.volume},`);
  lines.push(`  },`);
  return lines.join("\n");
}

async function appendToAudioJs(kind, entryText) {
  const text = await fs.readFile(AUDIO_JS, "utf8");
  const constName = kind === "music" ? "MUSIC" : "SFX";
  const re = new RegExp(`(export const ${constName} = \\{)([\\s\\S]*?)(\\n\\};)`);
  const match = re.exec(text);
  if (!match) {
    throw new Error(`Couldn't find "export const ${constName} = { ... };" in audio.js`);
  }
  const [full, open, body, close] = match;
  const trimmedBody = body.replace(/\n+$/, "");
  const sep = trimmedBody.trim() ? "\n\n" : "\n";
  const newFull = open + trimmedBody + sep + entryText + "\n" + close;
  const newText = text.replace(full, newFull);
  await fs.writeFile(AUDIO_JS, newText, "utf8");
}

function cleanPath(p) {
  if (!p) return "";
  return p.trim().replace(/^['"]|['"]$/g, "");
}

async function main() {
  const rl = readline.createInterface({ input, output });
  const ask = async (q, def) => {
    const prompt = def !== undefined && def !== "" ? `${q} [${def}]: ` : `${q}: `;
    const ans = (await rl.question(prompt)).trim();
    return ans || def || "";
  };

  console.log("\n=== Add Audio ===");
  console.log("Adds a music track or SFX to src/content/audio.js,");
  console.log("copies the file into public/audio/, and credits it automatically.\n");

  const kindAns = (await ask("Type (music/sfx)", "music")).toLowerCase();
  const kind = kindAns.startsWith("s") ? "sfx" : "music";

  const sourceUrl = await ask("Source URL");
  if (!sourceUrl) {
    console.log("\nSource URL is required for attribution. Aborting.");
    rl.close();
    return;
  }

  const license = detectLicense(sourceUrl);
  console.log(`  Detected license: ${license.name}`);

  console.log("  Fetching page for title hint...");
  const pageInfo = await fetchPageInfo(sourceUrl);
  if (pageInfo.title) console.log(`  Title hint: "${pageInfo.title}"`);
  if (pageInfo.mp3Url) console.log(`  Found MP3 URL: ${pageInfo.mp3Url}`);

  // Source file: try auto-download first, then ask.
  let localFile = null;
  let tempPath = null;
  if (pageInfo.mp3Url) {
    const tryAuto = (await ask("Download automatically? (y/n)", "y"))
      .toLowerCase()
      .startsWith("y");
    if (tryAuto) {
      tempPath = path.join(PROJECT_ROOT, `_temp_audio_${Date.now()}.mp3`);
      try {
        console.log("  Downloading...");
        await downloadTo(pageInfo.mp3Url, tempPath);
        console.log(`  Downloaded to ${tempPath}`);
        localFile = tempPath;
      } catch (e) {
        console.log(`  Auto-download failed: ${e.message}`);
        tempPath = null;
      }
    }
  }
  if (!localFile) {
    const p = await ask("Local file path (drag/drop or type)");
    localFile = cleanPath(p);
  }
  if (!localFile) {
    console.log("\nNo file provided. Aborting.");
    rl.close();
    return;
  }
  if (!existsSync(localFile)) {
    console.log(`\nFile not found: ${localFile}`);
    rl.close();
    return;
  }

  // Metadata
  const id = await ask("Internal id (camelCase, e.g. wastelandAmbient1)");
  if (!id || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(id)) {
    console.log("\nID must be a valid identifier (letters/digits/underscore, starting with a letter).");
    rl.close();
    return;
  }
  const title = await ask("Title", pageInfo.title || "");
  if (!title) {
    console.log("\nTitle is required.");
    rl.close();
    return;
  }
  const artist = await ask("Artist (or blank)");
  let tags = [];
  if (kind === "music") {
    const tagsStr = await ask(
      "Tags (comma-separated, e.g. era1, ambient, calm)"
    );
    tags = tagsStr.split(",").map((s) => s.trim()).filter(Boolean);
  }
  const volumeStr = await ask("Volume multiplier (0..1)", "0.8");
  const volume = Math.max(0, Math.min(1, parseFloat(volumeStr) || 0.8));
  let loop = true;
  if (kind === "music") {
    const loopAns = await ask("Loop? (y/n)", "y");
    loop = loopAns.toLowerCase().startsWith("y");
  }
  const licenseName = await ask("License", license.name);
  const attributionAns = await ask(
    "Attribution required? (y/n)",
    license.attribution ? "y" : "n"
  );
  const attribution = attributionAns.toLowerCase().startsWith("y");

  // Copy file into the project.
  const ext = path.extname(localFile) || ".mp3";
  const filename = `${id}${ext}`;
  const subdir = kind === "music" ? "music" : "sfx";
  const destPath = path.join(PUBLIC_AUDIO, subdir, filename);
  const fileWebPath = `/audio/${subdir}/${filename}`;

  console.log(`\nCopying to public/audio/${subdir}/${filename}...`);
  await copyFile(localFile, destPath);

  // Build entry
  const entryText = formatEntry(kind, {
    id,
    title,
    artist: artist || null,
    file: fileWebPath,
    license: licenseName,
    sourceUrl,
    attribution,
    tags,
    loop,
    volume,
  });

  console.log("\n--- Generated entry ---\n");
  console.log(entryText);
  console.log("\n-----------------------\n");

  const confirmAns = await ask("Append to src/content/audio.js?", "y");
  if (confirmAns.toLowerCase().startsWith("y")) {
    await appendToAudioJs(kind, entryText);
    console.log(`\n✓ Added "${title}" to ${kind} registry.`);
    console.log(`  File: ${fileWebPath}`);
    console.log(`  Run \`npm run dev\` and the credits section picks it up automatically.`);
  } else {
    console.log("\nNot appended. Copy the snippet above manually if you want to add it.");
  }

  // Clean up temp file
  if (tempPath) {
    try {
      await fs.unlink(tempPath);
    } catch {
      /* ignore */
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});

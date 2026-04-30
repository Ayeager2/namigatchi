# tools/

Development scripts that help work on the project but aren't part of the
shipped game. Each tool is a Node.js script you run from the command line.

## Available tools

### `add-audio.js`

Walks you through adding a music track or SFX to the game.

**Usage:**

```bash
npm run add-audio
# or directly:
node tools/add-audio.js
```

**What it does:**

1. Asks if you're adding music or SFX.
2. Asks for a source URL (Pixabay, Free Music Archive, Incompetech, etc.).
3. Fetches the page to suggest a title.
4. Tries to find a direct MP3 link on the page and download it for you.
   This works on some hosts (e.g. when a `<source>` tag exposes the URL)
   and not others (most hosts session-lock their downloads). If auto-download
   fails, the tool falls back to asking for a local file path — drag/drop
   the MP3 from your file manager into the terminal and it'll handle the rest.
5. Prompts for `id`, title, artist, tags (music only), volume, loop, license.
6. Auto-detects the license from common source domains.
7. Copies the file into `public/audio/{music|sfx}/` as `id.mp3`.
8. Appends a properly-formatted entry to `src/content/audio.js`.

After it finishes, the Credits section in Settings automatically picks up
the new track and shows attribution. Run `npm run dev` to verify.

**Recommended workflow** when adding from Pixabay:

1. Find a track at `https://pixabay.com/music/...`.
2. Click the download button on Pixabay (gives you the MP3 in your Downloads).
3. Run `npm run add-audio`.
4. Paste the Pixabay URL when asked.
5. When asked for the local file path, drag the downloaded MP3 from your file
   manager into the terminal window — it pastes the path. Press Enter.
6. Fill in the rest of the prompts.

## Adding a new tool

Drop a new `.js` script in this folder, write a `main()` function that does
the thing, and add an entry here. If it's something the user runs often, also
add it as an npm script in `package.json`.

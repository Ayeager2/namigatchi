// Audio asset registry — DATA, not code.
// Adding a music track or SFX = new entry here. The audio system picks it up
// automatically and the credits section renders the attribution.
//
// Files live in /public/audio/music/ and /public/audio/sfx/.
// Vite serves /public as the site root, so /audio/music/foo.mp3 in code maps
// to public/audio/music/foo.mp3 on disk.
//
// Each track has:
//   id, title, artist, file
//   license          — short license name (e.g. "CC-BY 4.0", "CC0", "Pixabay Free")
//   sourceUrl        — link to where the track came from
//   attribution      — true if license REQUIRES credit shown to user
//   tags             — for picking tracks by era/mood ["era1", "ambient", "calm"]
//   loop             — bool; default true for music, false for sfx
//   volume           — per-track volume multiplier (0..1), default 1.0

export const MUSIC = {
  // Empty for now. Add entries like:
  //
  // wastelandAmbient1: {
  //   id: "wastelandAmbient1",
  //   title: "Empty Roads",
  //   artist: "Some Artist",
  //   file: "/audio/music/empty-roads.mp3",
  //   license: "Pixabay Free",
  //   sourceUrl: "https://pixabay.com/music/...",
  //   attribution: false,
  //   tags: ["era1", "ambient", "calm"],
  //   loop: true,
  //   volume: 0.8,
  // },

  era0AmbientMusic: {
    id: "era0AmbientMusic",
    title: "Dark Ambient Soundscape",
    artist: "LemonMusicLab",
    file: "/audio/music/era0AmbientMusic.mp3",
    license: "Pixabay Content License",
    sourceUrl: "https://pixabay.com/music/mystery-dark-ambient-soundscape-505384/",
    attribution: true,
    tags: ["era0", "ambient", "calm"],
    loop: true,
    volume: 0.5,
  },

  era1Wasteland0: {
    id: "era1Wasteland0",
    title: "SigmaMusicArt - Tension",
    artist: "SigmaMusicArt",
    file: "/audio/music/era1Wasteland0.mp3",
    license: "Pixabay Content License",
    sourceUrl: "https://pixabay.com/music/horror-scene-tension-tension-music-503993/",
    attribution: true,
    tags: ["era1", "ambient", "tension"],
    loop: true,
    volume: 0.8,
  },

  era1Wasteland1: {
    id: "era1Wasteland1",
    title: "AlexGrohl - Tension",
    artist: "AlexGrohl",
    file: "/audio/music/era1Wasteland1.mp3",
    license: "Pixabay Content License",
    sourceUrl: "https://pixabay.com/music/ambient-tension-181766/",
    attribution: true,
    tags: ["era1", "ambient", "tension"],
    loop: true,
    volume: 0.8,
  },

};

export const SFX = {
  // Empty for now. Add entries like:
  //
  // gather: {
  //   id: "gather",
  //   title: "Dust scrape",
  //   artist: "freesound user X",
  //   file: "/audio/sfx/gather.mp3",
  //   license: "CC0",
  //   sourceUrl: "https://freesound.org/people/...",
  //   attribution: false,
  //   loop: false,
  //   volume: 0.6,
  // },
};

export const getMusic = (id) => MUSIC[id] || null;
export const getSfx = (id) => SFX[id] || null;
export const getAllMusic = () => Object.values(MUSIC);
export const getAllSfx = () => Object.values(SFX);

// Music tracks tagged with the given tag (e.g. by era).
export const getMusicByTag = (tag) =>
  getAllMusic().filter((m) => (m.tags || []).includes(tag));

// Find a music track for a specific era (matches the "eraN" tag).
// Returns null if no track is tagged for that era — caller should fade to
// silence in that case.
export function getMusicForEra(era) {
  const matches = getMusicByTag(`era${era}`);
  return matches[0] || null;
}

// All tracks (music + sfx) that require attribution. Used by the Credits UI.
export function getCreditedTracks() {
  const out = [];
  for (const m of getAllMusic()) out.push({ ...m, kind: "music" });
  for (const s of getAllSfx()) out.push({ ...s, kind: "sfx" });
  return out;
}

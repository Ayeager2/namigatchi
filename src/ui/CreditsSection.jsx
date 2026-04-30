// Credits section — auto-rendered from the audio asset registry.
// Shows attribution for every music track and SFX in the game, even ones
// whose license doesn't strictly require it (because being a good citizen
// is good practice).
//
// When the audio registry is empty, shows an honest empty state.

import { getCreditedTracks } from "../content/audio.js";

export default function CreditsSection() {
  const tracks = getCreditedTracks();
  const music = tracks.filter((t) => t.kind === "music");
  const sfx = tracks.filter((t) => t.kind === "sfx");

  return (
    <section className="settings-section">
      <h3>Credits</h3>
      {tracks.length === 0 ? (
        <p className="muted settings-help">
          No audio is in the game yet. As music and sound are added, every
          track and its license will appear here.
        </p>
      ) : (
        <>
          {music.length > 0 && (
            <div className="credits-block">
              <div className="credits-block-title">Music</div>
              <ul className="credits-list">
                {music.map((t) => (
                  <CreditItem key={t.id} track={t} />
                ))}
              </ul>
            </div>
          )}
          {sfx.length > 0 && (
            <div className="credits-block">
              <div className="credits-block-title">Sound</div>
              <ul className="credits-list">
                {sfx.map((t) => (
                  <CreditItem key={t.id} track={t} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function CreditItem({ track }) {
  return (
    <li className="credit-item">
      <div className="credit-title">
        "{track.title}"{track.artist ? ` by ${track.artist}` : ""}
      </div>
      <div className="credit-meta">
        <span>{track.license}</span>
        {track.sourceUrl && (
          <>
            <span className="credit-sep">·</span>
            <a
              href={track.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="credit-link"
            >
              source
            </a>
          </>
        )}
      </div>
    </li>
  );
}

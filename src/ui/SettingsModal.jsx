// Settings modal — accessible via the floating gear icon.
// Hosts theme/font/size accessibility options + save export/import.
// Settings apply live as the user clicks (no Apply button needed).

import {
  downloadSaveFile,
  importSaveFromJSON,
  readSaveFile,
} from "../systems/saveIO.js";
import CreditsSection from "./CreditsSection.jsx";
import { getMusic, getAllMusic } from "../content/audio.js";

function OptionRow({ label, options, value, onChange }) {
  return (
    <div className="settings-row">
      <div className="settings-label">{label}</div>
      <div className="settings-options">
        {options.map((opt) => (
          <button
            key={opt.value}
            className={`settings-option ${value === opt.value ? "is-active" : ""}`}
            onClick={() => onChange(opt.value)}
            title={opt.description || ""}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsModal({ settings, update, state, onClose }) {
  const allMusic = getAllMusic();
  const unlocked = state.persistent.unlockedMusic || {};
  const unlockedTracks = allMusic.filter((m) => unlocked[m.id]);
  const pinnedTrack = settings.pinnedMusicId
    ? getMusic(settings.pinnedMusicId)
    : null;
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !window.confirm(
        "Importing a save will replace your current progress. Continue?"
      )
    ) {
      e.target.value = "";
      return;
    }
    readSaveFile(
      file,
      (text) => {
        const result = importSaveFromJSON(text);
        if (result.success) {
          window.location.reload();
        } else {
          window.alert("Import failed: " + result.error);
        }
      },
      (err) => window.alert("Import failed: " + err)
    );
    e.target.value = "";
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal modal--settings"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Settings"
      >
        <header className="modal-header">
          <div>
            <h2>Settings</h2>
            <p className="muted modal-subtitle">
              Display preferences, accessibility, and saves.
            </p>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="modal-body">
          <section className="settings-section">
            <h3>Display</h3>

            <OptionRow
              label="Theme"
              value={settings.theme}
              onChange={(v) => update({ theme: v })}
              options={[
                { value: "dark", label: "Dark" },
                { value: "sepia", label: "Sepia" },
              ]}
            />

            <OptionRow
              label="Font"
              value={settings.font}
              onChange={(v) => update({ font: v })}
              options={[
                { value: "system", label: "System", description: "Default sans-serif" },
                {
                  value: "lexend",
                  label: "Lexend",
                  description: "Designed for reading proficiency",
                },
                {
                  value: "atkinson",
                  label: "Atkinson",
                  description: "Atkinson Hyperlegible, designed for low vision",
                },
              ]}
            />

            <OptionRow
              label="Text size"
              value={settings.fontSize}
              onChange={(v) => update({ fontSize: v })}
              options={[
                { value: "small", label: "Small" },
                { value: "normal", label: "Normal" },
                { value: "large", label: "Large" },
              ]}
            />
          </section>

          <section className="settings-section">
            <h3>Accessibility</h3>
            <p className="muted settings-help">
              Some moments in the game use brief flashing or pulsing
              animations (the rock awakening, etc.). If you have
              photosensitive epilepsy or vestibular disorders, choose
              "Reduced" to replace them with gentle fade-ins.
            </p>
            <OptionRow
              label="Motion"
              value={settings.motion}
              onChange={(v) => update({ motion: v })}
              options={[
                {
                  value: "auto",
                  label: "Auto",
                  description: "Follow your system's reduced-motion setting",
                },
                {
                  value: "reduced",
                  label: "Reduced",
                  description: "Always calm — gentle fades, no flashes",
                },
                {
                  value: "full",
                  label: "Full",
                  description: "Always full animations",
                },
              ]}
            />
          </section>

          <section className="settings-section">
            <h3>Audio</h3>

            <div className="settings-row">
              <div className="settings-label">Mute</div>
              <div className="settings-options">
                <button
                  className={`settings-option ${settings.muted ? "is-active" : ""}`}
                  onClick={() => update({ muted: !settings.muted })}
                  aria-pressed={settings.muted}
                >
                  {settings.muted ? "🔇 Muted" : "🔊 On"}
                </button>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-label">Master</div>
              <div className="settings-slider-row">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.masterVolume}
                  onChange={(e) =>
                    update({ masterVolume: Number(e.target.value) })
                  }
                  className="settings-slider"
                  disabled={settings.muted}
                />
                <span className="settings-slider-value">
                  {settings.masterVolume}
                </span>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-label">Music</div>
              <div className="settings-slider-row">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.musicVolume}
                  onChange={(e) =>
                    update({ musicVolume: Number(e.target.value) })
                  }
                  className="settings-slider"
                  disabled={settings.muted}
                />
                <span className="settings-slider-value">
                  {settings.musicVolume}
                </span>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-label">Sound</div>
              <div className="settings-slider-row">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sfxVolume}
                  onChange={(e) =>
                    update({ sfxVolume: Number(e.target.value) })
                  }
                  className="settings-slider"
                  disabled={settings.muted}
                />
                <span className="settings-slider-value">
                  {settings.sfxVolume}
                </span>
              </div>
            </div>

            {unlockedTracks.length > 0 && (
              <>
                <div className="settings-row">
                  <div className="settings-label">Music</div>
                  <div className="settings-options music-tracks">
                    <button
                      className={`settings-option ${
                        !settings.pinnedMusicId ? "is-active" : ""
                      }`}
                      onClick={() => update({ pinnedMusicId: null })}
                      title="Music auto-selects based on your current era"
                    >
                      Auto
                    </button>
                    {unlockedTracks.map((t) => (
                      <button
                        key={t.id}
                        className={`settings-option ${
                          settings.pinnedMusicId === t.id ? "is-active" : ""
                        }`}
                        onClick={() => update({ pinnedMusicId: t.id })}
                        title={`${t.title}${t.artist ? ` — ${t.artist}` : ""}`}
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="muted settings-help">
                  {settings.pinnedMusicId && pinnedTrack
                    ? `Pinned: "${pinnedTrack.title}" — plays regardless of era.`
                    : "Auto: music changes as you progress through eras. New tracks unlock when you reach the era they belong to."}
                </p>
              </>
            )}
          </section>

          <section className="settings-section">
            <h3>Save management</h3>
            <p className="muted settings-help">
              Saves are stored in your browser. Export a copy to back up or move
              between devices. Settings are saved separately and won't transfer
              with the save file.
            </p>
            <div className="settings-row">
              <div className="settings-label">Save file</div>
              <div className="settings-options">
                <button
                  className="settings-option"
                  onClick={() => downloadSaveFile(state)}
                >
                  Export
                </button>
                <label className="settings-option settings-import">
                  Import
                  <input
                    type="file"
                    accept="application/json,.json"
                    style={{ display: "none" }}
                    onChange={handleImport}
                  />
                </label>
              </div>
            </div>
          </section>

          <CreditsSection />
        </div>
      </div>
    </div>
  );
}

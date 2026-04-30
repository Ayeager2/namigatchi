// Settings modal — accessible via the floating gear icon.
// Hosts theme/font/size accessibility options + save export/import.
// Settings apply live as the user clicks (no Apply button needed).

import {
  downloadSaveFile,
  importSaveFromJSON,
  readSaveFile,
} from "../systems/saveIO.js";

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
        </div>
      </div>
    </div>
  );
}

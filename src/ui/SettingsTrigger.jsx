// Floating gear icon that opens the settings modal.
// Bottom-right, fixed-position. Always present.

export default function SettingsTrigger({ onOpen }) {
  return (
    <button
      type="button"
      className="settings-trigger"
      onClick={onOpen}
      aria-label="Open settings"
      title="Settings"
    >
      ⚙
    </button>
  );
}

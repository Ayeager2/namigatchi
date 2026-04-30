// Save export / import — download the current save as JSON, or load one from
// a file. Useful for testing, sharing test cases, or migrating between devices.
//
// On import, the save is written to localStorage and the page is reloaded.
// This routes through the normal load path, which handles version migration.

const STORAGE_KEY = "namigatchi-save";

// Build a JSON payload representing the current save.
export function buildSaveJSON(state) {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      persistent: state.persistent,
      run: state.run,
    },
    null,
    2
  );
}

// Trigger a browser download of the save as a JSON file.
export function downloadSaveFile(state) {
  const json = buildSaveJSON(state);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `namigatchi-save-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Slight delay before revoke so the click finishes.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Validate and write an imported JSON string to localStorage, then reload.
// Returns { success, error? }.
export function importSaveFromJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Save file is not a valid object.");
    }
    if (!parsed.persistent || !parsed.run) {
      throw new Error("Save file is missing persistent or run state.");
    }
    // Write to localStorage in the format loadGame expects.
    const payload = {
      version: parsed.version || 1,
      persistent: parsed.persistent,
      run: parsed.run,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Read a File object and call the callback with its text content.
export function readSaveFile(file, onText, onError) {
  const reader = new FileReader();
  reader.onload = (e) => onText(e.target.result);
  reader.onerror = () => onError("Failed to read file.");
  reader.readAsText(file);
}

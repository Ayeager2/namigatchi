// Crafting view (#48) — full takeover for crafting sub-tabs.
//
// Placeholder for the crafting page. #43 plumbs the view swap; #48 fills
// this in with the sub-tabbed crafting takeover:
//   Blacksmithing · Alchemy · Fletching · Farming · Woodworking · Tailoring
// At that point ToolsModal retires in favor of this full-screen view.

export default function CraftingView() {
  return (
    <section className="action-panel action-panel--crafting">
      <div className="panel-header">
        <h2>Crafting</h2>
        <p className="muted">
          The shaped, the brewed, the forged. The work of making.
        </p>
      </div>
      <div className="view-placeholder">
        <p className="muted">
          The crafting workspace lands with task #48 — sub-tabbed by discipline
          (Blacksmithing, Alchemy, Fletching, Farming, Woodworking, Tailoring),
          taking over from the Tools modal.
        </p>
      </div>
    </section>
  );
}

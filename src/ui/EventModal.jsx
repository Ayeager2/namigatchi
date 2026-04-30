// Modal that pops up when a choice event fires.
// Shows the event's flavor text and the player's options. Each option's cost
// is shown if any. Picking a choice dispatches RESPOND_TO_EVENT.
//
// No close button — choice events demand a response. (You CAN walk away from
// the elder, but that IS a choice with a recorded consequence.)

import { getEvent } from "../content/events.js";
import { getResource } from "../content/resources.js";

export default function EventModal({ state, actions }) {
  const active = state.run.activeEvent;
  if (!active) return null;
  const event = getEvent(active.id);
  if (!event) return null;

  return (
    <div className="modal-overlay" role="presentation">
      <div
        className="modal modal--event"
        role="dialog"
        aria-label={event.name}
      >
        <header className="modal-header">
          <div>
            <h2>{event.name}</h2>
          </div>
        </header>

        <div className="modal-body modal-body--event">
          <p className="event-flavor">{event.flavor}</p>

          <div className="event-choices">
            {event.choices?.map((choice) => {
              // Determine if cost can be afforded
              let canAfford = true;
              if (choice.cost) {
                for (const [res, qty] of Object.entries(choice.cost)) {
                  if ((state.run.inventory[res] || 0) < qty) {
                    canAfford = false;
                    break;
                  }
                }
              }

              return (
                <button
                  key={choice.id}
                  className={`event-choice ${canAfford ? "" : "is-disabled"}`}
                  onClick={() => actions.respondToEvent(choice.id)}
                  disabled={!canAfford}
                  title={canAfford ? "" : choice.missingMessage || ""}
                >
                  <div className="event-choice-label">{choice.label}</div>
                  {choice.cost && (
                    <div className="event-choice-cost">
                      {Object.entries(choice.cost).map(([res, qty]) => {
                        const r = getResource(res);
                        return (
                          <span key={res} className="event-choice-cost-item">
                            {r?.icon} {qty}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

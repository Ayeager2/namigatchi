import React, { useEffect, useMemo, useState } from "react";
import { getAllMinigames } from "../tama/minigames";
import "./tamaminigamepanel.css";

export default function TamaMinigamePanel ({ state, actions, onExit }) {
  const games = useMemo(() => getAllMinigames(), []);
  const [activeId, setActiveId] = useState(games[0]?.id || "");
  const [lastResult, setLastResult] = useState(null);

  const active = useMemo(
    () => games.find((g) => g.id === activeId) || games[0] || null,
    [games, activeId]
  );

  useEffect(() => {
    if (!activeId && games.length) setActiveId(games[0].id);
  }, [games, activeId]);

  const stats = (state.minigameStats || {})[active?.id] || {
    plays: 0,
    wins: 0,
    streak: 0,
    bestStreak: 0,
  };

  const canPlay = active?.canPlay ? active.canPlay(state) : false;

  function playCoinFlip(guess) {
    const out = actions.playMinigame(active.id, { guess });
    if (out) setLastResult(out);
  }

  function formatEconomyHint(game, lastResult) {
  if (!game) return null;

  const entry = Number(game.costCoins || 0);
  const extra =
    Number(lastResult?.meta?.extra ?? game?.meta?.extra ?? 0); // meta extra if you store it

  if (entry <= 0) return "Free • Fun up • Energy down";

  // For Tier C: win pays entry + extra (net +extra)
  const winPays = entry + (extra || 0);
  const net = extra || 0;

  return `Entry: ${entry} 💰 • Win pays: ${winPays} 💰 (net +${net})`;
}


  return (
    <div className="mg-panel">
      <div className="mg-header">
        <div className="mg-headerLeft">
          <div className="mg-title">Minigames</div>
          <div className="mg-sub">Pick a game • Win streaks later (C/D)</div>
        </div>

        <div className="mg-headerRight">
          <div className="mg-coins">💰 {state.coins ?? 0}</div>
          {onExit && (
            <button className="mg-btn mg-btn--ghost" onClick={onExit}>
              Back
            </button>
          )}
        </div>
      </div>

      <div className="mg-body">
        <div className="mg-left">
          <div className="mg-list">
            {games.map((g) => {
              const isActive = g.id === active?.id;
              return (
                <button
                  key={g.id}
                  className={`mg-gameBtn ${isActive ? "is-active" : ""}`}
                  onClick={() => {
                    setActiveId(g.id);
                    setLastResult(null);
                  }}
                >
                  <div className="mg-gameBtnTop">
                    <span className={`mg-tier mg-tier--${String(g.tier || "").toLowerCase()}`}>
                      {g.tier}
                    </span>
                    <span className="mg-gameName">{g.name}</span>
                  </div>
                  <div className="mg-gameMetaRow">
                    <span className={`mg-costBadge ${g.costCoins ? "is-paid" : "is-free"}`}>
                      {g.costCoins ? `Entry ${g.costCoins} 💰` : "Free"}
                    </span>

                    <span className="mg-miniMeta">
                      {String(g.tier || "").toUpperCase()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mg-right">
          {!active ? (
            <div className="mg-empty">No games available.</div>
          ) : (
            <div className="mg-card">
              <div className="mg-cardTop">
                <div className="mg-cardTitleRow">
                  <div className="mg-cardTitle">
                    <span className="mg-tierBadge">{active.tier}</span>
                    {active.name}
                  </div>
                  <div className="mg-stats">
                    <div className="mg-stat">
                      <span>Plays</span> <b>{stats.plays}</b>
                    </div>
                    <div className="mg-stat">
                      <span>Wins</span> <b>{stats.wins}</b>
                    </div>
                    <div className="mg-stat">
                      <span>Streak</span> <b>{stats.streak}</b>
                    </div>
                    <div className="mg-stat">
                      <span>Best</span> <b>{stats.bestStreak}</b>
                    </div>
                  </div>
                </div>

                {active.description && <div className="mg-desc">{active.description}</div>}
                <div className="mg-econ">
                  {formatEconomyHint(active, lastResult)}
                </div>
              </div>

              <div className="mg-actions">
                {active.id === "coin_flip" && (
                  <div className="mg-actionRow">
                    <button className="mg-btn" disabled={!canPlay} onClick={() => playCoinFlip("heads")}>
                      Heads
                    </button>
                    <button className="mg-btn" disabled={!canPlay} onClick={() => playCoinFlip("tails")}>
                      Tails
                    </button>
                  </div>
                )}
                {active.id === "lucky_dice" && (
                  <div className="mg-actionRow">
                    <button className="mg-btn" disabled={!canPlay} onClick={() => actions.playMinigame(active.id, { guess: "high" })}>
                      High (4–6)
                    </button>
                    <button className="mg-btn" disabled={!canPlay} onClick={() => actions.playMinigame(active.id, { guess: "low" })}>
                      Low (1–3)
                    </button>
                  </div>
                )}
                {active.id === "high_low" && (
                  <div className="mg-actionRow">
                    <button className="mg-btn" disabled={!canPlay} onClick={() => {
                      const out = actions.playMinigame(active.id, { guess: "higher" });
                      if (out) setLastResult(out);
                    }}>
                      Higher
                    </button>

                    <button className="mg-btn" disabled={!canPlay} onClick={() => {
                      const out = actions.playMinigame(active.id, { guess: "lower" });
                      if (out) setLastResult(out);
                    }}>
                      Lower
                    </button>
                  </div>
                )}

                {active.id === "treasure_chest" && (
                  <div className="mg-actionRow">
                    <button className="mg-btn" disabled={!canPlay} onClick={() => {
                      const out = actions.playMinigame(active.id, { pick: 1 });
                      if (out) setLastResult(out);
                    }}>
                      Chest 1
                    </button>

                    <button className="mg-btn" disabled={!canPlay} onClick={() => {
                      const out = actions.playMinigame(active.id, { pick: 2 });
                      if (out) setLastResult(out);
                    }}>
                      Chest 2
                    </button>

                    <button className="mg-btn" disabled={!canPlay} onClick={() => {
                      const out = actions.playMinigame(active.id, { pick: 3 });
                      if (out) setLastResult(out);
                    }}>
                      Chest 3
                    </button>
                  </div>
                )}

              </div>

              {!canPlay && (
                <div className="mg-note">
                  {state.sleeping ? "😴 Sleeping — wake up to play." : "Not available right now."}
                </div>
              )}

              {lastResult && (
                <div className={`mg-result ${lastResult.win ? "is-win" : "is-lose"}`}>
                  <div className="mg-resultMsg">{lastResult.message}</div>
                  <div className="mg-resultRow">
                    <span className="mg-pill">FUN {formatSigned(lastResult.rewards?.fun)}</span>
                    <span className="mg-pill">ENERGY {formatSigned(lastResult.rewards?.energy)}</span>
                    {lastResult.rewards?.coins ? (
                      <span className="mg-pill">COINS {formatSigned(lastResult.rewards?.coins)}</span>
                    ) : null}
                  </div>
                  
                  {lastResult?.meta?.first && lastResult?.meta?.second && (
                    <div className="mg-note">
                      Roll: <b>{lastResult.meta.first}</b> → <b>{lastResult.meta.second}</b>
                    </div>
                  )}

                  {lastResult?.meta?.chests && (
                    <div className="mg-note">
                      Reveal: 1=<b>{lastResult.meta.chests[1]}</b> • 2=<b>{lastResult.meta.chests[2]}</b> • 3=<b>{lastResult.meta.chests[3]}</b>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatSigned(n) {
  const v = Number(n || 0);
  if (v === 0) return "+0";
  return v > 0 ? `+${v}` : `${v}`;
}

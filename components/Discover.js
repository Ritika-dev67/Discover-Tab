"use client";

import { useCallback, useEffect, useState } from "react";
import SwipeCard, { CardBody } from "./SwipeCard";
import MatchModal from "./MatchModal";
import Matches from "./Matches";

export default function Discover() {
  const [view, setView] = useState("swipe"); // "swipe" | "matches"
  const [profiles, setProfiles] = useState(null); // null = loading
  const [matches, setMatches] = useState([]);
  const [exit, setExit] = useState(null); // "like" | "pass" | null (top card animating out)
  const [newMatch, setNewMatch] = useState(null);
  const [error, setError] = useState("");

  const loadFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/feed");
      const data = await res.json();
      setProfiles(data.profiles);
    } catch {
      setError("Couldn't load profiles. Is the server running?");
      setProfiles([]);
    }
  }, []);

  const loadMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches");
      const data = await res.json();
      setMatches(data.matches);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    loadFeed();
    loadMatches();
  }, [loadFeed, loadMatches]);

  const current = profiles && profiles[0];

  // Called once the top card has finished flying off screen.
  async function handleExited() {
    const profile = current;
    const action = exit;
    setExit(null);
    setProfiles((prev) => prev.slice(1)); // remove it from the deck right away
    setError("");

    try {
      const res = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id, action }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.match) {
        setNewMatch(data.profile);
        loadMatches();
      }
    } catch {
      // The swipe wasn't saved: put the card back so the user can try again.
      setProfiles((prev) => [profile, ...prev]);
      setError("Couldn't save that swipe. Please try again.");
    }
  }

  const requestExit = useCallback(
    (action) => {
      if (!current || exit || newMatch) return;
      setExit(action);
    },
    [current, exit, newMatch]
  );

  // Keyboard support on desktop: ← pass, → like
  useEffect(() => {
    if (view !== "swipe") return;
    function onKey(e) {
      if (e.key === "ArrowRight") requestExit("like");
      if (e.key === "ArrowLeft") requestExit("pass");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, requestExit]);

  async function resetDemo() {
    await fetch("/api/reset", { method: "POST" });
    setProfiles(null);
    setMatches([]);
    loadFeed();
  }

  return (
    <div className="discover">
      <header className="discover-header">
        <div className="logo">coy</div>
        <div className="segmented">
          <button className={view === "swipe" ? "seg active" : "seg"} onClick={() => setView("swipe")}>
            Swipe
          </button>
          <button className={view === "matches" ? "seg active" : "seg"} onClick={() => setView("matches")}>
            Matches{matches.length > 0 && <span className="badge">{matches.length}</span>}
          </button>
        </div>
      </header>

      {view === "matches" ? (
        <Matches matches={matches} onBack={() => setView("swipe")} />
      ) : profiles === null ? (
        <div className="center-msg">Loading…</div>
      ) : !current ? (
        <div className="center-msg empty">
          <div className="empty-emoji">✨</div>
          <h2>You're all caught up</h2>
          <p>No more profiles for now. Check back soon for new people.</p>
          <button className="btn primary" onClick={() => setView("matches")}>
            View matches ({matches.length})
          </button>
          <button className="btn ghost" onClick={resetDemo}>Reset demo data</button>
        </div>
      ) : (
        <>
          <div className="deck">
            {profiles[1] && (
              <div className="card under-card" key={profiles[1].id}>
                <CardBody profile={profiles[1]} />
              </div>
            )}
            <SwipeCard
              key={current.id}
              profile={current}
              exit={exit}
              onRequestExit={requestExit}
              onExited={handleExited}
            />
          </div>

          {error && <div className="toast">{error}</div>}

          <div className="actions">
            <button className="round pass" aria-label="Pass" onClick={() => requestExit("pass")}>✕</button>
            <button className="round like" aria-label="Like" onClick={() => requestExit("like")}>♥</button>
          </div>
        </>
      )}

      {newMatch && (
        <MatchModal
          profile={newMatch}
          onClose={() => setNewMatch(null)}
          onViewMatches={() => {
            setNewMatch(null);
            setView("matches");
          }}
        />
      )}
    </div>
  );
}

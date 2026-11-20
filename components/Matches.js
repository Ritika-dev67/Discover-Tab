"use client";

// List of mutual matches. Only people who liked the user AND were liked back ever appear here.
export default function Matches({ matches, onBack }) {
  if (matches.length === 0) {
    return (
      <div className="center-msg empty">
        <div className="empty-emoji">💌</div>
        <h2>No matches yet</h2>
        <p>When you and someone else both like each other, they'll show up here.</p>
        <button className="btn primary" onClick={onBack}>Start swiping</button>
      </div>
    );
  }

  return (
    <div className="matches-grid">
      {matches.map((m) => (
        <div className="match-tile" key={m.id}>
          <img src={m.photo} alt={m.name} onError={(e) => (e.currentTarget.style.display = "none")} />
          <div className="match-tile-info">
            <strong>{m.name}, {m.age}</strong>
            <span>{m.location}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

// Full-screen "It's a match!" overlay, shown only when both people have liked each other.
export default function MatchModal({ profile, onClose, onViewMatches }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="match-modal">
        <div className="hearts">💖</div>
        <h1>It's a match!</h1>
        <p>You and {profile.name} liked each other.</p>

        <div className="match-photos">
          <div className="match-photo you">You</div>
          <img className="match-photo" src={profile.photo} alt={profile.name} />
        </div>

        <button className="btn primary" onClick={onViewMatches}>View matches</button>
        <button className="btn ghost light" onClick={onClose}>Keep swiping</button>
      </div>
    </div>
  );
}

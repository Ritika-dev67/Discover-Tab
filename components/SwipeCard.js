"use client";

import { useEffect, useRef, useState } from "react";

const THRESHOLD = 100; // px of horizontal drag needed to count as a swipe
const EXIT_MS = 320;

// The top card. Handles drag (touch + mouse via pointer events) and the fly-off animation.
// `exit` is "like" | "pass" | null. It is set either by a drag release past the threshold
// or by the parent when a button / arrow key is used, so both paths share one animation.
export default function SwipeCard({ profile, exit, onRequestExit, onExited }) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const start = useRef(null);

  // After the fly-off animation, tell the parent the card is gone.
  useEffect(() => {
    if (!exit) return;
    const t = setTimeout(onExited, EXIT_MS);
    return () => clearTimeout(t);
  }, [exit]); // eslint-disable-line react-hooks/exhaustive-deps

  function onPointerDown(e) {
    if (exit) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
  }

  function onPointerMove(e) {
    if (!start.current || exit) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true });
  }

  function onPointerUp() {
    if (!start.current) return;
    const dx = drag.x;
    start.current = null;
    if (Math.abs(dx) > THRESHOLD) {
      setDrag({ x: 0, y: 0, active: false });
      onRequestExit(dx > 0 ? "like" : "pass");
    } else {
      setDrag({ x: 0, y: 0, active: false }); // spring back
    }
  }

  // Visual state
  let transform, transition;
  if (exit) {
    const dir = exit === "like" ? 1 : -1;
    transform = `translate(${dir * 120}vw, -40px) rotate(${dir * 28}deg)`;
    transition = `transform ${EXIT_MS}ms ease-in, opacity ${EXIT_MS}ms ease-in`;
  } else {
    transform = `translate(${drag.x}px, ${drag.y * 0.3}px) rotate(${drag.x / 18}deg)`;
    transition = drag.active ? "none" : "transform 0.25s cubic-bezier(.2,.8,.3,1)";
  }

  const likeOpacity = exit === "like" ? 1 : Math.min(Math.max(drag.x / THRESHOLD, 0), 1);
  const passOpacity = exit === "pass" ? 1 : Math.min(Math.max(-drag.x / THRESHOLD, 0), 1);

  return (
    <div
      className="card top-card"
      style={{ transform, transition, opacity: exit ? 0 : 1 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <CardBody profile={profile} />
      <div className="stamp stamp-like" style={{ opacity: likeOpacity }}>LIKE</div>
      <div className="stamp stamp-pass" style={{ opacity: passOpacity }}>NOPE</div>
    </div>
  );
}

// Shared by the top card and the static card peeking out underneath.
export function CardBody({ profile }) {
  return (
    <>
      <img
        className="card-photo"
        src={profile.photo}
        alt={profile.name}
        draggable={false}
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <div className="card-info">
        <h2>
          {profile.name}, <span>{profile.age}</span>
        </h2>
        <p className="card-loc">📍 {profile.location}</p>
        <p className="card-bio">{profile.bio}</p>
        <div className="chips">
          {profile.interests.map((i) => (
            <span className="chip" key={i}>{i}</span>
          ))}
        </div>
      </div>
    </>
  );
}

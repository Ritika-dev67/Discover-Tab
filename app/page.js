"use client";

import { useState } from "react";
import Discover from "@/components/Discover";

// App shell: a bottom tab bar with a blank "Home" placeholder and the "Discover" tab.
// Both tabs stay mounted so Discover keeps its state when you switch tabs.
export default function Page() {
  const [tab, setTab] = useState("discover");

  return (
    <div className="app">
      <main className="tab-content">
        <section className="tab-pane" hidden={tab !== "home"} aria-label="Home" />
        <section className="tab-pane" hidden={tab !== "discover"} aria-label="Discover">
          <Discover />
        </section>
      </main>

      <nav className="tab-bar">
        <button className={tab === "home" ? "tab active" : "tab"} onClick={() => setTab("home")}>
          <span className="tab-icon">🏠</span>
          <span>Home</span>
        </button>
        <button className={tab === "discover" ? "tab active" : "tab"} onClick={() => setTab("discover")}>
          <span className="tab-icon">🔥</span>
          <span>Discover</span>
        </button>
      </nav>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

/**
 * Sticky banner that appears when the browser loses its network connection.
 * Dismisses automatically when connectivity is restored (§14.6).
 *
 * Exact wording per spec: "You appear to be offline. Changes may not be saved."
 */
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Read initial state after mount — navigator is not available during SSR
    setIsOffline(!navigator.onLine);

    function goOffline() { setIsOffline(true); }
    function goOnline()  { setIsOffline(false); }

    window.addEventListener("offline", goOffline);
    window.addEventListener("online",  goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online",  goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "#fff3e0",
        borderBottom: "0.5px solid rgba(180,83,9,0.2)",
        color: "#b45309",
        fontSize: "13px",
        textAlign: "center",
        padding: "8px 16px",
      }}
    >
      You appear to be offline. Changes may not be saved.
    </div>
  );
}

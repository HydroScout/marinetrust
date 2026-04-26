import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FlaggedShip } from "../types";
import { API_BASE_URL } from "../utils";

export default function FlaggedShipsPage() {
  const navigate = useNavigate();
  const [ships, setShips] = useState<FlaggedShip[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/flaggedShips`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch flagged ships.");
        return res.json();
      })
      .then((data: FlaggedShip[]) => setShips(data))
      .catch((err) => {
        console.error(err);
        setError("Could not load flagged ships. Ensure the API is running.");
      });
  }, []);

  const handleSelect = (ship: FlaggedShip) => {
    navigate("/check-ship", {
      state: { shipId: String(ship.id), date: ship.flaggedDate },
    });
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 24px",
        color: "#374151",
        overflowY: "auto",
      }}
    >
      <div style={{ width: "100%", maxWidth: "720px" }}>
        <h1
          style={{
            margin: "0 0 8px 0",
            fontSize: "2rem",
            color: "#111827",
            textAlign: "center",
          }}
        >
          Flagged Ships
        </h1>
        <p
          style={{
            margin: "0 0 32px 0",
            fontSize: "1rem",
            lineHeight: 1.6,
            color: "#4b5563",
            textAlign: "center",
          }}
        >
          Select a vessel to inspect its track on the day it was flagged.
        </p>

        {error && (
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {!error && ships === null && (
          <div style={{ textAlign: "center", color: "#6b7280" }}>Loading…</div>
        )}

        {!error && ships !== null && ships.length === 0 && (
          <div style={{ textAlign: "center", color: "#6b7280" }}>
            No flagged ships yet. Vessels with confirmed collisions will appear here.
          </div>
        )}

        {!error && ships && ships.length > 0 && (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {ships.map((ship) => (
              <li key={`${ship.id}-${ship.flaggedDate}`}>
                <button
                  onClick={() => handleSelect(ship)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    padding: "16px 20px",
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s ease, border-color 0.15s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span
                      style={{
                        fontSize: "1rem",
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {ship.name}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                      ID {ship.id} · {ship.type}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#b45309",
                      background: "#fef3c7",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Flagged {ship.flaggedDate}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import homeIcon from "../../assets/home-icon-silhouette.png";
import boatIcon from "../../assets/boat.png";
import warningIcon from "../../assets/warning.png";

export type NavTab = "home" | "follow" | "flagged";

const TABS: { id: NavTab; label: string; icon: string; path: string }[] = [
  { id: "home", label: "Home", icon: homeIcon, path: "/" },
  { id: "follow", label: "Check a ship", icon: boatIcon, path: "/check-ship" },
  { id: "flagged", label: "Flagged incidents", icon: warningIcon, path: "/flagged" },
];

export default function NavBar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const width = isCollapsed ? 64 : 220;

  return (
    <nav
      style={{
        height: "100%",
        width,
        flexShrink: 0,
        background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          borderBottom: "1px solid #f3f4f6",
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          gap: "8px",
        }}
      >
        {!isCollapsed && (
          <h1
            style={{
              margin: 0,
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Aspersorium
          </h1>
        )}
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            color: "#4b5563",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", padding: "8px" }}>
        {TABS.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              title={isCollapsed ? tab.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                marginBottom: "4px",
                background: isActive ? "#eff6ff" : "transparent",
                color: isActive ? "#2563eb" : "#374151",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: isActive ? 600 : 500,
                textAlign: "left",
                transition: "background 0.15s ease",
                justifyContent: isCollapsed ? "center" : "flex-start",
              }}
              onMouseOver={(e) => {
                if (!isActive) e.currentTarget.style.background = "#f9fafb";
              }}
              onMouseOut={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <img
                src={tab.icon}
                alt=""
                style={{
                  width: 22,
                  height: 22,
                  objectFit: "contain",
                  flexShrink: 0,
                  opacity: isActive ? 1 : 0.75,
                }}
              />
              {!isCollapsed && <span>{tab.label}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

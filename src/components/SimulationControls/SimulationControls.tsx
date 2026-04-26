import { formatTime } from "../../utils";

interface SimulationControlsProps {
  date: string;
  shipId: string;
  currentTimeIso: string;
  timeIndex: number;
  framesLength: number;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onTimeIndexChange: (index: number) => void;
  onDateShift: (daysToAdd: number) => void;
  onReset: () => void;
}

export default function SimulationControls({
  date,
  shipId,
  currentTimeIso,
  timeIndex,
  framesLength,
  isPlaying,
  onPlayToggle,
  onTimeIndexChange,
  onDateShift,
  onReset,
}: SimulationControlsProps) {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        <button
          onClick={() => onDateShift(-1)}
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            cursor: "pointer",
            color: "#4b5563",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#f3f4f6")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#f9fafb")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {date} • {shipId}
          </div>
          <h3
            style={{
              margin: "4px 0 0 0",
              fontSize: "1.1rem",
              color: "#3b82f6",
            }}
          >
            {formatTime(currentTimeIso)}
          </h3>
        </div>

        <button
          onClick={() => onDateShift(1)}
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            cursor: "pointer",
            color: "#4b5563",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#f3f4f6")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#f9fafb")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <button
          onClick={onPlayToggle}
          style={{
            background: isPlaying ? "#ef4444" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "background 0.2s ease, transform 0.1s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {isPlaying ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ marginLeft: "2px" }}
            >
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          )}
        </button>

        <input
          type="range"
          min={0}
          max={framesLength - 1}
          value={timeIndex}
          onChange={(e) => onTimeIndexChange(Number(e.target.value))}
          style={{ width: "100%", cursor: "pointer" }}
        />
      </div>

      <div
        style={{
          fontSize: "0.85rem",
          color: "#4b5563",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={onReset}
          style={{
            background: "none",
            border: "none",
            color: "#ef4444",
            cursor: "pointer",
            textDecoration: "underline",
            padding: 0,
          }}
        >
          Reset
        </button>
      </div>
    </>
  );
}

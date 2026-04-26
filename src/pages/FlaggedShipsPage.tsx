export default function FlaggedShipsPage() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px",
        color: "#374151",
      }}
    >
      <div style={{ maxWidth: "560px", textAlign: "center" }}>
        <h1 style={{ margin: "0 0 12px 0", fontSize: "2rem", color: "#111827" }}>
          Flagged Ships
        </h1>
        <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6, color: "#4b5563" }}>
          No flagged ships yet. Vessels with confirmed collisions will appear here.
        </p>
      </div>
    </div>
  );
}

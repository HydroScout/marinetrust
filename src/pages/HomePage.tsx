export default function HomePage() {
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
          Welcome to Aspersorium
        </h1>
        <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6, color: "#4b5563" }}>
          Track ships, simulate oil-spill drift, and review flagged vessels.
          Use the navigation on the left to get started.
        </p>
      </div>
    </div>
  );
}

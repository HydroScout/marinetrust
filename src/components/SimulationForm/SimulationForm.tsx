interface SimulationFormProps {
  shipId: string;
  date: string;
  isLoading: boolean;
  onShipIdChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onSubmit: () => void;
}

export default function SimulationForm({
  shipId,
  date,
  isLoading,
  onShipIdChange,
  onDateChange,
  onSubmit,
}: SimulationFormProps) {
  const isDisabled = !date || !shipId || isLoading;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <h3 style={{ margin: "0", fontSize: "1.1rem", color: "#111827" }}>
        Configure Simulation
      </h3>

      <input
        type="text"
        placeholder="Enter Ship ID (e.g., IMO 9123456)"
        value={shipId}
        onChange={(e) => onShipIdChange(e.target.value)}
        style={{
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid #d1d5db",
          fontSize: "0.9rem",
        }}
      />

      <input
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        disabled={isLoading}
        style={{
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid #d1d5db",
          fontSize: "0.9rem",
        }}
      />

      <button
        onClick={onSubmit}
        disabled={isDisabled}
        style={{
          padding: "10px",
          borderRadius: "6px",
          border: "none",
          background: isDisabled ? "#e5e7eb" : "#2563eb",
          color: isDisabled ? "#9ca3af" : "white",
          fontWeight: "bold",
          cursor: isDisabled ? "not-allowed" : "pointer",
          transition: "background 0.2s",
        }}
      >
        {isLoading ? "Fetching Data..." : "Load Data"}
      </button>
    </div>
  );
}

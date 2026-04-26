// src/App.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar/NavBar";
import HomePage from "./pages/HomePage";
import CheckShipPage from "./pages/CheckShipPage";
import FlaggedShipsPage from "./pages/FlaggedShipsPage";

export default function App() {
  return (
    <main style={{ width: "100vw", height: "100vh", display: "flex" }}>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/check-ship" element={<CheckShipPage />} />
        <Route path="/flagged" element={<FlaggedShipsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

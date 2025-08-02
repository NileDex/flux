import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState } from "react";

import Dashboard from "./components/Dashboard";
import SwapPage from "./components/SwapPage";
import TotalTransactions from "./components/TotalTransactions";
import Web3TopNavbar from "./util/Web3TopNavbar";
import Hero from './components/Hero';

function AppContent() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Top Navigation - always visible */}
        <Web3TopNavbar
          mobileOpen={mobileNavOpen}
          setMobileOpen={setMobileNavOpen}
        />
      {/* Hero Section */}
      <Hero />
      {/* Main Content */}
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/network-transactions" element={<TotalTransactions />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>

    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
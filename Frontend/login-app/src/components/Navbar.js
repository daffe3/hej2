import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Global.css";

export default function Navbar({ username, onLogout }) {
  const location = useLocation();

  return (
    <nav className="navbar">
      <span className="nav-brand">Anteckningar</span>
      <div className="nav-left">
        <Link
          to="/dashboard"
          className="nav-link"
          style={location.pathname === "/dashboard" ? { color: "var(--black)", fontWeight: 500 } : {}}
        >
          Dashboard
        </Link>
        <Link
          to="/profile"
          className="nav-link"
          style={location.pathname.startsWith("/profile") ? { color: "var(--black)", fontWeight: 500 } : {}}
        >
          Profil
        </Link>
      </div>
      <div className="nav-right">
        <span className="username">{username}</span>
        <button className="logout-btn" onClick={onLogout}>Logga ut</button>
      </div>
    </nav>
  );
}

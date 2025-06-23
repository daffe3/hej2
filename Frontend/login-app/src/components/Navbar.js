import React from "react";
import { Link } from "react-router-dom";
import "./Global.css";

export default function Navbar({ username, onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/profile" className="nav-link">Profil</Link>
      </div>
      <div className="nav-right">
        <span className="username">Hej, {username}!</span>
        <button className="logout-btn" onClick={onLogout}>Logga ut</button>
      </div>
    </nav>
  );
}

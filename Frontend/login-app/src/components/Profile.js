import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../utils/axiosClient";
import "./Global.css";


export default function Profile() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient
      .get("/profile")
      .then((res) => {
        setUsername(res.data.username);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="profile-container">Laddar profil...</div>;

  return (
    <div className="profile-container">
      <h2>Min Profil</h2>
      <div className="profile-info">
        <label>Användarnamn:</label>
        <span>{username}</span>
      </div>

      <Link to="/profile/settings" style={{ marginTop: "20px", display: "inline-block" }}>
        Gå till inställningar
      </Link>
    </div>
  );
}

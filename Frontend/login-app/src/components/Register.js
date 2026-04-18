import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../utils/axiosClient";
import "./Global.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setMessage("");
    try {
      await axiosClient.post("/register", { username, password });
      setSuccess(true);
      setMessage("Konto skapat! Omdirigerar...");
      setUsername("");
      setPassword("");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setSuccess(false);
      setMessage(err.response?.data?.error || "Något gick fel");
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-box">
        <h2>Skapa konto</h2>
        <p className="welcome-text">
          Hantera dina anteckningar enkelt och säkert. 
        </p>

        <input
          type="text"
          placeholder="Välj ett användarnamn"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRegister()}
          autoComplete="username"
        />

        <input
          type="password"
          placeholder="Välj ett lösenord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRegister()}
          autoComplete="new-password"
        />

        <button className="btn-register" onClick={handleRegister}>
          Skapa konto
        </button>

        {message && (
          <p className={`message ${success ? "success" : ""}`}>{message}</p>
        )}

        <p className="login-text">
          Har du redan ett konto?{" "}
          <span className="login-link" onClick={() => navigate("/login")}>
            Logga in
          </span>
        </p>
      </div>
    </div>
  );
}

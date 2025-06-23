import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../utils/axiosClient";
import "./Global.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    setMessage("");
    try {
      await axiosClient.post("/register", {
        username,
        password,
      });
      setMessage("Registrering lyckades! Du kan nu logga in.");
      setUsername("");
      setPassword("");
      setTimeout(() => navigate("/login"), 2000); 
    } catch (err) {
      setMessage(err.response?.data?.error || "Något gick fel");
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-box">
        <h2>Skapa konto</h2>
        <p className="welcome-text">
          Välkommen! Skapa ett konto för att komma igång och hantera dina anteckningar på ett enkelt och säkert sätt.
        </p>

        <input
          type="text"
          placeholder="Användarnamn"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />

        <input
          type="password"
          placeholder="Lösenord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <button className="btn-register" onClick={handleRegister}>
          Registrera
        </button>

        {message && <p className="message">{message}</p>}

        <p className="login-text">
          Har du redan ett konto?{" "}
          <span className="login-link" onClick={() => navigate("/login")}>
            Logga in här
          </span>
        </p>
      </div>
    </div>
  );
}

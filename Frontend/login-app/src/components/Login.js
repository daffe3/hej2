import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../utils/axiosClient";
import "./Global.css";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      navigate("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async () => {
    setMessage("");
    try {
      const res = await axiosClient.post("/login", { username, password });
      const token = res.data.accessToken || res.data.token;
      localStorage.setItem("accessToken", token);
      if (onLogin) onLogin(token);
      navigate("/dashboard");
    } catch (err) {
      setMessage(err.response?.data?.error || "Något gick fel");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <h2>Välkommen tillbaka</h2>
        <p className="login-subtitle">Logga in för att se dina anteckningar</p>

        <input
          type="text"
          placeholder="Användarnamn"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          autoComplete="username"
        />

        <input
          type="password"
          placeholder="Lösenord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          autoComplete="current-password"
        />

        <button className="btn-login" onClick={handleLogin}>
          Logga in
        </button>

        {message && <p className="message">{message}</p>}

        <p className="register-text">
          Inget konto?{" "}
          <span className="register-link" onClick={() => navigate("/register")}>
            Registrera dig
          </span>
        </p>
      </div>
    </div>
  );
}

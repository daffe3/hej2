import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../utils/axiosClient";
import "./Global.css"; 

export default function Login() {
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
      const res = await axiosClient.post("/login", {
        username,
        password,
      });

      const token = res.data.accessToken || res.data.token;
      localStorage.setItem("accessToken", token);
      setMessage("Inloggad!");
      navigate("/dashboard");
    } catch (err) {
      setMessage(err.response?.data?.error || "Något gick fel");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <h2>Logga in</h2>

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
          autoComplete="current-password"
        />

        <button className="btn-login" onClick={handleLogin}>
          Logga in
        </button>

        {message && <p className="message">{message}</p>}

        <p className="register-text">
          Har du inget konto?{" "}
          <span
            className="register-link"
            onClick={() => navigate("/register")}
          >
            Registrera här
          </span>
        </p>
      </div>
    </div>
  );
}
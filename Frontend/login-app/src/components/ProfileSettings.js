import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../utils/axiosClient";
import "./Global.css";

export default function ProfileSettings() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();

  const handleChangePassword = async () => {
    setMessage("");
    if (!oldPassword || !newPassword) {
      setMessageType("error");
      setMessage("Fyll i båda lösenorden.");
      return;
    }
    try {
      const res = await axiosClient.put("/profile/password", {
        oldPassword,
        newPassword,
      });
      setMessageType("success");
      setMessage(res.data.message || "Lösenord uppdaterat.");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.error || "Något gick fel");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setMessageType("error");
      setMessage("Klicka igen för att bekräfta borttagning.");
      setConfirmDelete(true);
      return;
    }
    try {
      await axiosClient.delete("/profile");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/login");
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.error || "Kunde inte ta bort kontot");
    }
  };

  return (
    <div className="profile-container">
      <h2>Inställningar</h2>

      <section>
        <h3>Byt lösenord</h3>
        <input
          type="password"
          placeholder="Nuvarande lösenord"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Nytt lösenord"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
        />
        <button onClick={handleChangePassword}>Uppdatera lösenord</button>
      </section>

      <section>
        <h3>Radera konto</h3>
        <button className="btn-danger" onClick={handleDeleteAccount}>
          {confirmDelete ? "Bekräfta radering" : "Radera konto"}
        </button>
      </section>

      {message && (
        <p style={{ color: messageType === "success" ? "var(--success)" : "var(--danger)" }}>
          {message}
        </p>
      )}
    </div>
  );
}

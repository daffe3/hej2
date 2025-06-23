import React, { useState } from "react";
import axiosClient from "../utils/axiosClient";
import "./Global.css";

export default function ProfileSettings() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleChangePassword = async () => {
    setMessage("");
    setError("");
    if (!oldPassword || !newPassword) {
      setError("Fyll i båda lösenorden.");
      return;
    }
    try {
      const res = await axiosClient.put("/profile/password", {
        oldPassword,
        newPassword,
      });
      setMessage(res.data.message || "Lösenord uppdaterat!");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.error || "Något gick fel");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setError("Bekräfta borttagning genom att klicka igen.");
      setConfirmDelete(true);
      return;
    }
    try {
      await axiosClient.delete("/profile");
      setMessage("Kontot är borttaget. Du loggas ut...");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    } catch (err) {
      setError(err.response?.data?.error || "Kunde inte ta bort kontot");
    }
  };

  return (
    <div className="profile-container">
      <h2>Profilinställningar</h2>

      <section>
        <h3>Byt lösenord</h3>
        <input
          type="password"
          placeholder="Gammalt lösenord"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Nytt lösenord"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button onClick={handleChangePassword}>Byt lösenord</button>
      </section>

      <section style={{ marginTop: "40px" }}>
        <h3>Ta bort konto</h3>
        <button
          onClick={handleDeleteAccount}
          style={{ backgroundColor: "red", color: "white" }}
        >
          {confirmDelete ? "Bekräfta borttagning" : "Ta bort konto"}
        </button>
      </section>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

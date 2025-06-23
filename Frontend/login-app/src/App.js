import React, { useState, useEffect } from "react";
import axiosClient from "./utils/axiosClient";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import "./App.css";

import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import ProfileSettings from "./components/ProfileSettings";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";


function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    setToken(storedToken);

    if (storedToken) {
      axiosClient
        .get("/profile")
        .then((res) => setUsername(res.data.username))
        .catch(() => {
          handleLogout();
        });
    } else {
      setUsername("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setUsername("");
    navigate("/login");
  };

  return (
    <>
      {token && <Navbar username={username} onLogout={handleLogout} />}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/settings"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Login />} />
      </Routes>
    </>
  );
}

export default AppWrapper;

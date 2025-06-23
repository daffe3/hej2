import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
    setIsAuthChecked(true);
  }, []);

  if (!isAuthChecked) {
    return null;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

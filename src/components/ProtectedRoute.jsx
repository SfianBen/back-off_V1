import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // 1. On vérifie si le token existe
  const token = localStorage.getItem("userToken");

  // 2. Si pas de token, retour à la case départ (Login)
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 3. Sinon, on laisse passer
  return <Outlet />;
};

export default ProtectedRoute;
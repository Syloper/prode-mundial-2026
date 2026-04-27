import React from "react";
import { Navigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import { useAuth } from "../../hooks/useAuth";
import { UserRole } from "../../types";

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<Props> = ({
  children,
  adminOnly = false,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
};

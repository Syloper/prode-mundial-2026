import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCompany } from "../../hooks/useCompany";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Box sx={{ flexGrow: 1, cursor: "pointer" }} onClick={() => navigate("/")}>
          <Typography variant="h6" component="span">
            PRODE 2026
          </Typography>
          {company?.name && (
            <Typography
              variant="subtitle2"
              component="span"
              sx={{ ml: 1, opacity: 0.85 }}
            >
              — {company.name}
            </Typography>
          )}
        </Box>

        {user && (
          <Typography variant="caption" sx={{ mr: 2, opacity: 0.85 }}>
            {user.name}
          </Typography>
        )}

        {user ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button color="inherit" component={RouterLink} to="/">
              Grupos
            </Button>
            <Button color="inherit" component={RouterLink} to="/podium">
              Ranking
            </Button>
            {user.role === "admin" && (
              <Button color="inherit" component={RouterLink} to="/admin">
                Admin
              </Button>
            )}
            <Button color="inherit" onClick={handleLogout}>
              Salir
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button color="inherit" component={RouterLink} to="/login">
              Login
            </Button>
            <Button color="inherit" component={RouterLink} to="/register">
              Registro
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

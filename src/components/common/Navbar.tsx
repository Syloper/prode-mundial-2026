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
      <Toolbar sx={{ gap: 1 }}>
        {/* Logo + nombre */}
        <Box
          sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <Box
            component="img"
            src="https://syloper.com/wp-content/uploads/logo-colores.svg"
            alt="Syloper"
            sx={{ height: 24 }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <Box sx={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              PRODE 2026
            </Typography>
            {company?.name && (
              <Typography variant="caption" sx={{ opacity: 0.75, lineHeight: 1.1 }}>
                {company.name}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Usuario actual */}
        {user && (
          <Typography
            variant="caption"
            sx={{ mr: 1, opacity: 0.8, display: { xs: "none", sm: "block" } }}
          >
            {user.name}
          </Typography>
        )}

        {/* Navegación */}
        {user ? (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Button color="inherit" component={RouterLink} to="/" size="small">
              Grupos
            </Button>
            <Button color="inherit" component={RouterLink} to="/bracket" size="small">
              Bracket
            </Button>
            <Button color="inherit" component={RouterLink} to="/podium" size="small">
              Ranking
            </Button>
            <Button color="inherit" component={RouterLink} to="/profile" size="small">
              Mi perfil
            </Button>
            {user.role === "admin" && (
              <Button color="inherit" component={RouterLink} to="/admin" size="small">
                Admin
              </Button>
            )}
            <Button
              color="inherit"
              onClick={handleLogout}
              size="small"
              sx={{ opacity: 0.8, "&:hover": { opacity: 1 } }}
            >
              Salir
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Button color="inherit" component={RouterLink} to="/login" size="small">
              Login
            </Button>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/register"
              size="small"
              sx={{
                borderColor: "#00B96B",
                color: "#00B96B",
                "&:hover": { backgroundColor: "rgba(0,185,107,0.1)" },
              }}
            >
              Registro
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

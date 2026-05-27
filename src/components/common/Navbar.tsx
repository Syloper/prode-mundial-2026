import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Menu, X } from "lucide-react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCompany } from "../../hooks/useCompany";
import { User } from "../../types";

type NavItem = { label: string; to: string };

const DRAWER = {
  text: "#FFFFFF",
  textMuted: "rgba(255, 255, 255, 0.75)",
  hover: "rgba(255, 255, 255, 0.08)",
  selectedBg: "rgba(0, 185, 107, 0.3)",
  selectedBorder: "#00B96B",
  divider: "rgba(255, 255, 255, 0.15)",
} as const;

const drawerItemSx = {
  color: DRAWER.text,
  borderRadius: 1,
  mb: 0.5,
  "&:hover": { backgroundColor: DRAWER.hover },
  "& .MuiListItemText-primary": { color: DRAWER.text },
  "&.Mui-selected": {
    backgroundColor: DRAWER.selectedBg,
    borderLeft: `3px solid ${DRAWER.selectedBorder}`,
    "&:hover": { backgroundColor: "rgba(0, 185, 107, 0.4)" },
    "& .MuiListItemText-primary": { color: DRAWER.text, fontWeight: 600 },
  },
  "&.Mui-selected:hover": { backgroundColor: "rgba(0, 185, 107, 0.4)" },
};

function getNavItems(user: User): NavItem[] {
  const items: NavItem[] = [
    { label: "Grupos", to: "/" },
    { label: "Bracket", to: "/bracket" },
    { label: "Ranking", to: "/podium" },
    { label: "Mi perfil", to: "/profile" },
  ];

  if (user.role === "data_entry") {
    items.push({ label: "Resultados", to: "/data-entry" });
  }
  if (user.role === "admin") {
    items.push({ label: "Admin", to: "/admin" });
  }

  return items;
}

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    setDrawerOpen(false);
    await logout();
    navigate("/login");
  };

  const closeDrawer = () => setDrawerOpen(false);

  const navLinkSx = {
    borderColor: "#00B96B",
    color: "#00B96B",
    "&:hover": { backgroundColor: "rgba(0,185,107,0.1)" },
  };

  const renderAuthButtons = (fullWidth = false) => (
    <Box sx={{ display: "flex", gap: 0.5, flexDirection: fullWidth ? "column" : "row" }}>
      <Button
        color="inherit"
        component={RouterLink}
        to="/login"
        size="small"
        fullWidth={fullWidth}
        onClick={closeDrawer}
        sx={fullWidth ? { color: DRAWER.text } : undefined}
      >
        Login
      </Button>
      <Button
        variant="outlined"
        component={RouterLink}
        to="/register"
        size="small"
        fullWidth={fullWidth}
        onClick={closeDrawer}
        sx={
          fullWidth
            ? {
                borderColor: DRAWER.selectedBorder,
                color: DRAWER.selectedBorder,
                "&:hover": {
                  backgroundColor: "rgba(0, 185, 107, 0.15)",
                  borderColor: "#33C47E",
                },
              }
            : navLinkSx
        }
      >
        Registro
      </Button>
    </Box>
  );

  const renderUserNav = (fullWidth = false) => {
    if (!user) return null;

    const items = getNavItems(user);

    if (fullWidth) {
      return (
        <List disablePadding sx={{ flex: 1 }}>
          {items.map((item) => (
            <ListItemButton
              key={item.to}
              component={RouterLink}
              to={item.to}
              selected={location.pathname === item.to}
              onClick={closeDrawer}
              sx={drawerItemSx}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
          <Divider sx={{ my: 1, borderColor: DRAWER.divider }} />
          <ListItemButton onClick={handleLogout} sx={drawerItemSx}>
            <ListItemText
              primary="Salir"
              primaryTypographyProps={{ sx: { color: DRAWER.textMuted } }}
            />
          </ListItemButton>
        </List>
      );
    }

    return (
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {items.map((item) => (
          <Button
            key={item.to}
            color="inherit"
            component={RouterLink}
            to={item.to}
            size="small"
          >
            {item.label}
          </Button>
        ))}
        <Button
          color="inherit"
          onClick={handleLogout}
          size="small"
          sx={{ opacity: 0.8, "&:hover": { opacity: 1 } }}
        >
          Salir
        </Button>
      </Box>
    );
  };

  return (
    <>
      <AppBar position="sticky">
        <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 1.5 },
              cursor: "pointer",
              minWidth: 0,
            }}
            onClick={() => navigate("/")}
          >
            <Box
              component="img"
              src="https://syloper.com/wp-content/uploads/logo-colores.svg"
              alt="Syloper"
              sx={{ height: { xs: 20, sm: 24 }, flexShrink: 0 }}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <Box sx={{ display: "flex", flexDirection: "column", lineHeight: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.1,
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                }}
                noWrap
              >
                PRODE 2026
              </Typography>
              {company?.name && (
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.75,
                    lineHeight: 1.1,
                    display: { xs: "none", sm: "block" },
                  }}
                  noWrap
                >
                  {company.name}
                </Typography>
              )}
            </Box>
          </Box>

          {user && !isMobile && (
            <Typography variant="caption" sx={{ mr: 1, opacity: 0.8 }} noWrap>
              {user.name}
            </Typography>
          )}

          {isMobile ? (
            <IconButton
              color="inherit"
              aria-label={drawerOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setDrawerOpen((open) => !open)}
              edge="end"
            >
              {drawerOpen ? <X size={22} /> : <Menu size={22} />}
            </IconButton>
          ) : user ? (
            renderUserNav()
          ) : (
            renderAuthButtons()
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={isMobile && drawerOpen}
        onClose={closeDrawer}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: "secondary.main",
            color: DRAWER.text,
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: DRAWER.text }} noWrap>
                PRODE 2026
              </Typography>
              {company?.name && (
                <Typography variant="caption" sx={{ color: DRAWER.textMuted }} noWrap>
                  {company.name}
                </Typography>
              )}
            </Box>
            <IconButton color="inherit" aria-label="Cerrar menú" onClick={closeDrawer} sx={{ color: DRAWER.text }}>
              <X size={20} />
            </IconButton>
          </Box>

          {user && (
            <Typography variant="body2" sx={{ color: DRAWER.textMuted, mb: 1 }}>
              {user.name}
            </Typography>
          )}

          <Divider sx={{ mb: 1, borderColor: DRAWER.divider }} />

          {user ? renderUserNav(true) : renderAuthButtons(true)}
        </Box>
      </Drawer>
    </>
  );
};

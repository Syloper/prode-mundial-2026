import React from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./theme";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { PrizeProvider } from "./contexts/PrizeContext";
import { PredictionProvider } from "./contexts/PredictionContext";
import { CompanyProvider } from "./contexts/CompanyContext";
import { Navbar } from "./components/common/Navbar";
import { NotificationSnackbar } from "./components/common/NotificationSnackbar";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { GroupsPage } from "./pages/GroupsPage";
import { PodiumPage } from "./pages/PodiumPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ProfilePage } from "./pages/ProfilePage";
import { BracketPage } from "./pages/BracketPage";
import { DataEntryDashboard } from "./pages/DataEntryDashboard";
import { AddMatchPage } from "./pages/AddMatchPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { isAddMatchFormEnabled } from "./config/features";

// Custom Layout wrapper to conditionally render Navbar
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  // No Navbar on /login or /register
  const hideNavbar = location.pathname === "/login" || location.pathname === "/register";
  return (
    <>
      {!hideNavbar && <Navbar />}
      <NotificationSnackbar />
      {children}
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <NotificationProvider>
            <CompanyProvider>
              <PrizeProvider>
                <PredictionProvider>
                  <BrowserRouter>
                    <AppLayout>
                      <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route
                          path="/"
                          element={
                            <ProtectedRoute>
                              <GroupsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/podium"
                          element={
                            <ProtectedRoute>
                              <PodiumPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/bracket"
                          element={
                            <ProtectedRoute>
                              <BracketPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/profile"
                          element={
                            <ProtectedRoute>
                              <ProfilePage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/data-entry"
                          element={
                            <ProtectedRoute allowedRoles={["admin", "data_entry"]}>
                              <DataEntryDashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin/add-match"
                          element={
                            isAddMatchFormEnabled ? (
                              <AddMatchPage />
                            ) : (
                              <Navigate to="/admin" replace />
                            )
                          }
                        />
                        <Route
                          path="/admin"
                          element={
                            <ProtectedRoute adminOnly>
                              <AdminDashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </AppLayout>
                  </BrowserRouter>
                </PredictionProvider>
              </PrizeProvider>
            </CompanyProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

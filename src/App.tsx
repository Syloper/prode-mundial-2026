import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { NotFoundPage } from "./pages/NotFoundPage";

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
                      <Navbar />
                      <NotificationSnackbar />
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
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
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

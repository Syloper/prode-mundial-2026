import React, { useState } from "react";
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Paper,
} from "@mui/material";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { PrizeForm } from "../components/admin/PrizeForm";
import { PrizeAssignment } from "../components/admin/PrizeAssignment";
import { PrizeHistory } from "../components/admin/PrizeHistory";
import { MatchResultsLoader } from "../components/admin/MatchResultsLoader";
import { AddMatchForm } from "../components/admin/AddMatchForm";
import { CompanyConfigComponent } from "../components/admin/CompanyConfig";
import { DangerZone } from "../components/admin/DangerZone";
import { UsersDashboard } from "../components/admin/UsersDashboard";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
);

export const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <ProtectedRoute adminOnly>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3 }}>
          👨‍💼 Panel de Administración
        </Typography>
        <Paper>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: "1px solid #e0e0e0" }}
          >
            <Tab label="👥 Usuarios" />
            <Tab label="🏆 Crear Premio" />
            <Tab label="🎁 Entregar Premio" />
            <Tab label="📜 Historial" />
            <Tab label="⚽ Resultados" />
            <Tab label="➕ Nuevo partido" />
            <Tab label="⚙️ Configuración" />
            <Tab label="⚠️ Zona peligrosa" />
          </Tabs>
          <Box sx={{ p: 3 }}>
            <TabPanel value={tab} index={0}>
              <UsersDashboard />
            </TabPanel>
            <TabPanel value={tab} index={1}>
              <PrizeForm />
            </TabPanel>
            <TabPanel value={tab} index={2}>
              <PrizeAssignment />
            </TabPanel>
            <TabPanel value={tab} index={3}>
              <PrizeHistory />
            </TabPanel>
            <TabPanel value={tab} index={4}>
              <MatchResultsLoader />
            </TabPanel>
            <TabPanel value={tab} index={5}>
              <AddMatchForm />
            </TabPanel>
            <TabPanel value={tab} index={6}>
              <CompanyConfigComponent />
            </TabPanel>
            <TabPanel value={tab} index={7}>
              <DangerZone />
            </TabPanel>
          </Box>
        </Paper>
      </Container>
    </ProtectedRoute>
  );
};
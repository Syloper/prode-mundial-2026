import React, { useMemo, useState } from "react";
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
import { isAddMatchFormEnabled } from "../config/features";

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

  const tabs = useMemo(() => {
    const items = [
      { label: "👥 Usuarios", content: <UsersDashboard /> },
      { label: "🏆 Crear Premio", content: <PrizeForm /> },
      { label: "🎁 Entregar Premio", content: <PrizeAssignment /> },
      { label: "📜 Historial", content: <PrizeHistory /> },
      { label: "⚽ Resultados", content: <MatchResultsLoader /> },
    ];

    if (isAddMatchFormEnabled) {
      items.push({ label: "➕ Nuevo partido", content: <AddMatchForm /> });
    }

    items.push(
      { label: "⚙️ Configuración", content: <CompanyConfigComponent /> },
      { label: "⚠️ Zona peligrosa", content: <DangerZone /> }
    );

    return items;
  }, []);

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
            {tabs.map((item) => (
              <Tab key={item.label} label={item.label} />
            ))}
          </Tabs>
          <Box sx={{ p: 3 }}>
            {tabs.map((item, index) => (
              <TabPanel key={item.label} value={tab} index={index}>
                {item.content}
              </TabPanel>
            ))}
          </Box>
        </Paper>
      </Container>
    </ProtectedRoute>
  );
};

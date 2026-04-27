import React, { useState } from "react";
import {
  Container, Box, Grid, Card, CardHeader, CardContent, Typography,
  Tabs, Tab, Chip, Stack,
} from "@mui/material";
import { useMatches } from "../hooks/useMatches";
import { useAuth } from "../hooks/useAuth";
import { usePrediction } from "../hooks/usePrediction";
import { MatchPredictionForm } from "../components/common/MatchPredictionForm";
import { GroupStandings } from "../components/common/GroupStandings";
import { Match } from "../types";

type GroupFilter = "all" | "pending" | "predicted" | "finished";

const KNOCKOUT_PHASES = ["Dieciseisavos", "Octavos", "Cuartos", "Semifinal", "Tercer puesto", "Final"];

export const GroupsPage: React.FC = () => {
  const { matches } = useMatches();
  const { user } = useAuth();
  const { getPrediction } = usePrediction();
  const [mainTab, setMainTab] = useState(0);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [knockoutPhase, setKnockoutPhase] = useState<string>("all");

  const groupMatches = matches.filter((m) => parseInt(m.id) <= 72);
  const knockoutMatches = matches.filter((m) => parseInt(m.id) > 72);

  const applyFilter = (ms: Match[]): Match[] => {
    if (!user || groupFilter === "all") return ms;
    return ms.filter((m) => {
      const pred = getPrediction(m.id, user.id);
      if (groupFilter === "predicted") return !!pred;
      if (groupFilter === "pending") return !pred && !m.isFinished;
      if (groupFilter === "finished") return m.isFinished;
      return true;
    });
  };

  const grouped = groupMatches.reduce((acc, m) => {
    if (!acc[m.group]) acc[m.group] = [];
    acc[m.group].push(m);
    return acc;
  }, {} as Record<string, Match[]>);

  const filteredKnockout = knockoutMatches.filter(
    (m) => knockoutPhase === "all" || m.phase === knockoutPhase
  );

  const knockoutByPhase = KNOCKOUT_PHASES.reduce((acc, phase) => {
    const ms = filteredKnockout.filter((m) => m.phase === phase);
    if (ms.length) acc[phase] = ms;
    return acc;
  }, {} as Record<string, Match[]>);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {!user && (
        <Box sx={{ mb: 3, p: 2, backgroundColor: "#fff3e0", borderRadius: 1 }}>
          <Typography variant="body2">
            💡 Iniciá sesión para cargar tus predicciones
          </Typography>
        </Box>
      )}

      <Tabs
        value={mainTab}
        onChange={(_, v) => setMainTab(v)}
        sx={{ mb: 3, borderBottom: "1px solid #e0e0e0" }}
      >
        <Tab label="⚽ Fase de Grupos" />
        <Tab label="🏆 Eliminación Directa" />
      </Tabs>

      {/* ── GRUPOS ── */}
      {mainTab === 0 && (
        <>
          {user && (
            <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap", gap: 1 }}>
              {(["all", "pending", "predicted", "finished"] as GroupFilter[]).map((f) => (
                <Chip
                  key={f}
                  label={{ all: "Todos", pending: "Sin predecir", predicted: "Predichos", finished: "Finalizados" }[f]}
                  onClick={() => setGroupFilter(f)}
                  color={groupFilter === f ? "primary" : "default"}
                  variant={groupFilter === f ? "filled" : "outlined"}
                  size="small"
                />
              ))}
            </Stack>
          )}
          <Grid container spacing={3}>
            {Object.entries(grouped).map(([group, gMatches]) => {
              const visible = applyFilter(gMatches);
              if (groupFilter !== "all" && visible.length === 0) return null;
              return (
                <Grid item xs={12} md={6} key={group}>
                  <Card>
                    <CardHeader title={`Grupo ${group}`} />
                    <CardContent>
                      <GroupStandings group={group} matches={gMatches} />
                      {(groupFilter === "all" ? gMatches : visible).map((m) => (
                        <MatchPredictionForm key={m.id} match={m} />
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}

      {/* ── ELIMINACIÓN DIRECTA ── */}
      {mainTab === 1 && (
        <>
          <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap", gap: 1 }}>
            <Chip
              label="Todas las fases"
              onClick={() => setKnockoutPhase("all")}
              color={knockoutPhase === "all" ? "primary" : "default"}
              variant={knockoutPhase === "all" ? "filled" : "outlined"}
              size="small"
            />
            {KNOCKOUT_PHASES.map((p) => (
              <Chip
                key={p}
                label={p}
                onClick={() => setKnockoutPhase(p)}
                color={knockoutPhase === p ? "primary" : "default"}
                variant={knockoutPhase === p ? "filled" : "outlined"}
                size="small"
              />
            ))}
          </Stack>

          {knockoutMatches.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
              <Typography>Los partidos de eliminación directa se cargarán cuando finalice la fase de grupos.</Typography>
            </Box>
          ) : Object.keys(knockoutByPhase).length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
              <Typography>No hay partidos para esta fase aún.</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {Object.entries(knockoutByPhase).map(([phase, ms]) => (
                <Grid item xs={12} md={phase === "Final" || phase === "Tercer puesto" ? 12 : 6} key={phase}>
                  <Card>
                    <CardHeader title={phase} />
                    <CardContent>
                      {ms.map((m) => (
                        <MatchPredictionForm key={m.id} match={m} />
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
};

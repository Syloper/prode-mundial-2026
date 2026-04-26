import React from "react";
import { Container, Box, Grid, Card, CardHeader, CardContent, Typography } from "@mui/material";
import { useMatches } from "../hooks/useMatches";
import { MatchPredictionForm } from "../components/common/MatchPredictionForm";
import { useAuth } from "../hooks/useAuth";

export const GroupsPage: React.FC = () => {
  const { matches } = useMatches();
  const { user } = useAuth();
  const grouped = matches.reduce((acc, m) => {
    if (!acc[m.group]) acc[m.group] = [];
    acc[m.group].push(m);
    return acc;
  }, {} as Record<string, typeof matches>);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
<Typography variant="h4" sx={{ mb: 4, fontWeight: "bold" }}>⚽ Fase de Grupos</Typography>
      {!user && (
        <Box sx={{ mb: 3, p: 2, backgroundColor: "#fff3e0", borderRadius: 1 }}>
          <Typography variant="body2">
            💡 Inicia sesión para poder cargar tus predicciones
          </Typography>
        </Box>
      )}
      <Grid container spacing={3}>
        {Object.entries(grouped).map(([group, groupMatches]) => (
          <Grid item xs={12} md={6} key={group}>
            <Card>
              <CardHeader title={"Grupo " + group} />
              <CardContent>
                {groupMatches.map(m => (
                  <MatchPredictionForm key={m.id} match={m} />
                ))}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};
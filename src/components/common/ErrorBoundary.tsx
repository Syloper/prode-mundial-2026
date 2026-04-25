import React from "react";
import { Container, Typography, Button, Box } from "@mui/material";

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 2 }}>
              Algo salió mal
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              {this.state.message || "Error inesperado en la aplicación."}
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                this.setState({ hasError: false, message: "" });
                window.location.reload();
              }}
            >
              Recargar página
            </Button>
          </Box>
        </Container>
      );
    }
    return this.props.children;
  }
}

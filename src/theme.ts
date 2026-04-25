import { createTheme } from "@mui/material/styles";

// Colores de marca Syloper
const SYLOPER_GREEN = "#00B96B";
const SYLOPER_DARK = "#2A3235";
const SYLOPER_GREEN_DARK = "#009958";
const SYLOPER_GREEN_LIGHT = "#E6F9F1";

export const theme = createTheme({
  palette: {
    primary: {
      main: SYLOPER_GREEN,
      dark: SYLOPER_GREEN_DARK,
      light: "#33C47E",
      contrastText: "#ffffff",
    },
    secondary: {
      main: SYLOPER_DARK,
      dark: "#1a2023",
      light: "#3d4f55",
      contrastText: "#ffffff",
    },
    success: {
      main: SYLOPER_GREEN,
      light: SYLOPER_GREEN_LIGHT,
    },
    error: {
      main: "#E53935",
    },
    warning: {
      main: "#FB8C00",
    },
    info: {
      main: "#039BE5",
    },
    background: {
      default: "#F4F6F5",
      paper: "#FFFFFF",
    },
    text: {
      primary: SYLOPER_DARK,
      secondary: "#5A6A6E",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 700,
      color: SYLOPER_DARK,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: SYLOPER_DARK,
          boxShadow: "0 2px 8px rgba(42,50,53,0.15)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 6,
        },
        containedPrimary: {
          backgroundColor: SYLOPER_GREEN,
          "&:hover": {
            backgroundColor: SYLOPER_GREEN_DARK,
          },
        },
        outlinedPrimary: {
          borderColor: SYLOPER_GREEN,
          color: SYLOPER_GREEN,
          "&:hover": {
            backgroundColor: SYLOPER_GREEN_LIGHT,
            borderColor: SYLOPER_GREEN_DARK,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorSuccess: {
          backgroundColor: SYLOPER_GREEN_LIGHT,
          color: SYLOPER_GREEN_DARK,
        },
        colorPrimary: {
          backgroundColor: SYLOPER_GREEN,
          color: "#fff",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: "0 2px 12px rgba(42,50,53,0.08)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          "&.Mui-selected": {
            color: SYLOPER_GREEN,
            fontWeight: 700,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: SYLOPER_GREEN,
          height: 3,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "&.Mui-focused fieldset": {
              borderColor: SYLOPER_GREEN,
            },
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: SYLOPER_GREEN,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        head: {
          backgroundColor: "#F4F6F5",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardSuccess: {
          backgroundColor: SYLOPER_GREEN_LIGHT,
          color: SYLOPER_GREEN_DARK,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        bar: {
          backgroundColor: SYLOPER_GREEN,
        },
      },
    },
  },
});

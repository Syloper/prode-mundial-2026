import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextField, Button, Box, Alert, InputAdornment, IconButton } from "@mui/material";
import { loginSchema, LoginFormData } from "../../utils/validators";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const LoginForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch {
      // El error ya está en el contexto de auth
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: "100%" }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TextField
        {...register("email")}
        label="Email"
        type="email"
        fullWidth
        margin="normal"
        autoComplete="email"
        error={!!errors.email}
        helperText={errors.email?.message}
      />
      <TextField
        {...register("password")}
        label="Contraseña"
        type={showPassword ? "text" : "password"}
        fullWidth
        margin="normal"
        autoComplete="current-password"
        error={!!errors.password}
        helperText={errors.password?.message}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword((prev) => !prev)}
                onMouseDown={(e) => e.preventDefault()} // evita que el input pierda foco
                edge="end"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 2 }}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Ingresando..." : "Ingresar"}
      </Button>
    </Box>
  );
};

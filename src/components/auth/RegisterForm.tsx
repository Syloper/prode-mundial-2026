import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextField, Button, Box, Alert, Typography } from "@mui/material";
import { registerSchema, RegisterFormData } from "../../utils/validators";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const RegisterForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });
  const { register: registerUser, error } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        dni: data.dni,
        password: data.password,
      });
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
        {...register("name")}
        label="Nombre completo"
        fullWidth
        margin="normal"
        autoComplete="name"
        error={!!errors.name}
        helperText={errors.name?.message}
      />
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
        {...register("dni")}
        label="DNI (solo números)"
        fullWidth
        margin="normal"
        inputProps={{ inputMode: "numeric" }}
        error={!!errors.dni}
        helperText={errors.dni?.message}
      />
      <TextField
        {...register("password")}
        label="Contraseña"
        type="password"
        fullWidth
        margin="normal"
        autoComplete="new-password"
        error={!!errors.password}
        helperText={errors.password?.message}
      />
<Typography variant="caption" sx={{ color: "#666", display: "block", mt: 1 }}>
        La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.
      </Typography>
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 2 }}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Registrando..." : "Registrarse"}
      </Button>
    </Box>
  );
};

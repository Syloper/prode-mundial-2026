import React, { createContext, useState, useCallback, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { User, RegisterData } from "../types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function buildUserFromSession(session: Session): Promise<User | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error || !profile) return null;
  if (profile.is_active === false) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: profile.name,
    dni: profile.dni,
    role: profile.role,
    createdAt: profile.created_at,
  };
}

async function resolveUserFromSession(session: Session): Promise<User | null> {
  const user = await buildUserFromSession(session);
  if (!user) {
    await supabase.auth.signOut();
  }
  return user;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | undefined;

    const applySession = async (session: Session | null) => {
      if (!mounted) return;
      if (!session) {
        setUser(null);
        return;
      }
      try {
        const u = await resolveUserFromSession(session);
        if (mounted) setUser(u);
      } catch {
        if (mounted) setUser(null);
      }
    };

    void supabase.auth
      .getSession()
      .then(({ data: { session } }) => applySession(session))
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    // Evita deadlock de Supabase al registrar el listener durante la init del token.
    const subscribeTimer = window.setTimeout(() => {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        // No usar await ni llamadas a supabase directamente dentro del callback.
        window.setTimeout(() => {
          void applySession(session);
        }, 0);
      });
      subscription = data.subscription;
    }, 0);

    return () => {
      mounted = false;
      window.clearTimeout(subscribeTimer);
      subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      const message =
        authError.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos"
          : authError.message;
      setError(message);
      throw new Error(message);
    }

    if (data.session) {
      const u = await resolveUserFromSession(data.session);
      if (!u) {
        const message = "Tu cuenta no está disponible. Contactá al administrador.";
        setError(message);
        throw new Error(message);
      }
      setUser(u);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setError(null);
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          dni: data.dni,
        },
      },
    });
    if (authError) {
      const raw = authError.message ?? "";
      const isDuplicateDni =
        raw.includes("profiles_dni_unique") ||
        raw.toLowerCase().includes("duplicate key") ||
        raw === "Database error saving new user";
      const message =
        authError.message === "User already registered"
          ? "Este email ya está registrado"
          : isDuplicateDni
            ? "Este DNI ya está registrado"
            : raw;
      setError(message);
      throw new Error(message);
    }

    if (signUpData.session) {
      const u = await resolveUserFromSession(signUpData.session);
      setUser(u);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, error, login, register, logout, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
};

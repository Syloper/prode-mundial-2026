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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const u = await buildUserFromSession(session);
        setUser(u);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const u = await buildUserFromSession(session);
        setUser(u);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
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
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setError(null);
    const { error: authError } = await supabase.auth.signUp({
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
      const message =
        authError.message === "User already registered"
          ? "Este email ya está registrado"
          : authError.message;
      setError(message);
      throw new Error(message);
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

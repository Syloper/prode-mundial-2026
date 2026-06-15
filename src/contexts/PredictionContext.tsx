import React, { createContext, useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface UserPrediction {
  matchId: string;
  homeScore: number;
  awayScore: number;
  createdAt: string;
  userId: string;
}

interface PredictionContextType {
  predictions: Record<string, UserPrediction>;
  isLoading: boolean;
  savePrediction: (
    matchId: string,
    homeScore: number,
    awayScore: number,
    userId: string
  ) => Promise<void>;
  getPrediction: (matchId: string, userId: string) => UserPrediction | null;
  deletePrediction: (matchId: string, userId: string) => Promise<void>;
  canPredict: (deadlineDate: Date) => boolean;
  canCancelPrediction: (scheduledDate: Date) => boolean;
  isPredictionLocked: (
    deadlineDate: Date,
    matchId: string,
    userId: string
  ) => boolean;
}

export const PredictionContext = createContext<PredictionContextType | undefined>(
  undefined
);

export const PredictionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [predictions, setPredictions] = useState<Record<string, UserPrediction>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);

  // Carga predicciones del usuario autenticado al cambiar sesión
  useEffect(() => {
    const loadForUser = async (userId: string) => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", userId);

      if (!error && data) {
        const map: Record<string, UserPrediction> = {};
        data.forEach((p) => {
          const key = `${p.user_id}-${p.match_id}`;
          map[key] = {
            matchId: String(p.match_id),
            homeScore: p.home_score,
            awayScore: p.away_score,
            createdAt: p.created_at,
            userId: p.user_id,
          };
        });
        setPredictions(map);
      }
      setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadForUser(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadForUser(session.user.id);
      } else {
        setPredictions({});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const savePrediction = useCallback(
    async (
      matchId: string,
      homeScore: number,
      awayScore: number,
      userId: string
    ) => {
      const key = `${userId}-${matchId}`;
      if (predictions[key]) return;

      const { data, error } = await supabase
        .from("predictions")
        .insert({
          match_id: parseInt(matchId),
          user_id: userId,
          home_score: homeScore,
          away_score: awayScore,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") throw new Error("Ya tenés una predicción para este partido");
        throw new Error("Error al guardar la predicción");
      }

      if (data) {
        setPredictions((prev) => ({
          ...prev,
          [key]: {
            matchId,
            homeScore,
            awayScore,
            createdAt: data.created_at,
            userId,
          },
        }));
      }
    },
    [predictions]
  );

  const getPrediction = useCallback(
    (matchId: string, userId: string): UserPrediction | null => {
      return predictions[`${userId}-${matchId}`] ?? null;
    },
    [predictions]
  );

  const deletePrediction = useCallback(
    async (matchId: string, userId: string) => {
      const key = `${userId}-${matchId}`;

      const { error } = await supabase
        .from("predictions")
        .delete()
        .eq("match_id", parseInt(matchId))
        .eq("user_id", userId);

      if (error) {
        throw new Error("No se pudo cancelar la predicción");
      }

      setPredictions((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  const canPredict = useCallback((deadlineDate: Date): boolean => {
    return new Date(deadlineDate) > new Date();
  }, []);

  const canCancelPrediction = useCallback((scheduledDate: Date): boolean => {
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    return new Date(scheduledDate).getTime() - Date.now() > threeDaysMs;
  }, []);

  const isPredictionLocked = useCallback(
    (deadlineDate: Date, matchId: string, userId: string): boolean => {
      const hasPrediction = !!predictions[`${userId}-${matchId}`];
      const pastDeadline = new Date(deadlineDate) <= new Date();
      return hasPrediction || pastDeadline;
    },
    [predictions]
  );

  return (
    <PredictionContext.Provider
      value={{
        predictions,
        isLoading,
        savePrediction,
        getPrediction,
        deletePrediction,
        canPredict,
        canCancelPrediction,
        isPredictionLocked,
      }}
    >
      {children}
    </PredictionContext.Provider>
  );
};

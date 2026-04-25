import React, { createContext, useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Prize, PrizeAssignment } from "../types";

interface PrizeContextType {
  prizes: Prize[];
  assignments: PrizeAssignment[];
  isLoading: boolean;
  createPrize: (
    prize: Omit<Prize, "id" | "createdAt">
  ) => Promise<void>;
  assignPrize: (
    assignment: Omit<PrizeAssignment, "id" | "assignmentDate">
  ) => Promise<void>;
  getPrizesForCriteria: (criteria: string) => Prize[];
  getAssignmentsForPrize: (prizeId: string) => PrizeAssignment[];
  refresh: () => Promise<void>;
}

export const PrizeContext = createContext<PrizeContextType | undefined>(
  undefined
);

function mapDbPrize(row: {
  id: string;
  name: string;
  description: string;
  photo_url: string | null;
  criteria: Prize["criteria"];
  assignment_type: Prize["assignmentType"];
  tie_resolution: Prize["tieResolution"];
  phase: string | null;
  created_at: string;
  created_by: string | null;
}): Prize {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    photoUrl: row.photo_url ?? undefined,
    criteria: row.criteria,
    assignmentType: row.assignment_type,
    tieResolution: row.tie_resolution,
    phase: row.phase ?? undefined,
    createdAt: row.created_at,
    createdBy: row.created_by ?? undefined,
  };
}

function mapDbAssignment(row: {
  id: string;
  prize_id: string;
  user_id: string;
  user_name: string | null;
  assignment_date: string;
  criteria: string;
  phase: string | null;
  assigned_by: string | null;
}): PrizeAssignment {
  return {
    id: row.id,
    prizeId: row.prize_id,
    userId: row.user_id,
    userName: row.user_name ?? undefined,
    assignmentDate: row.assignment_date,
    criteria: row.criteria,
    phase: row.phase ?? undefined,
    assignedBy: row.assigned_by ?? undefined,
  };
}

export const PrizeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [assignments, setAssignments] = useState<PrizeAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const [{ data: prizesData }, { data: assignmentsData }] = await Promise.all([
      supabase.from("prizes").select("*").order("created_at"),
      supabase.from("prize_assignments").select("*").order("assignment_date"),
    ]);
    if (prizesData) setPrizes(prizesData.map(mapDbPrize));
    if (assignmentsData) setAssignments(assignmentsData.map(mapDbAssignment));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) refresh();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) refresh();
      else {
        setPrizes([]);
        setAssignments([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  const createPrize = useCallback(
    async (prize: Omit<Prize, "id" | "createdAt">) => {
      const { error } = await supabase.from("prizes").insert({
        name: prize.name,
        description: prize.description,
        photo_url: prize.photoUrl || null,
        criteria: prize.criteria,
        assignment_type: prize.assignmentType,
        tie_resolution: prize.tieResolution,
        phase: prize.phase || null,
        created_by: prize.createdBy || null,
      });
      if (error) throw new Error("Error al crear el premio");
      await refresh();
    },
    [refresh]
  );

  const assignPrize = useCallback(
    async (assignment: Omit<PrizeAssignment, "id" | "assignmentDate">) => {
      const { error } = await supabase.from("prize_assignments").insert({
        prize_id: assignment.prizeId,
        user_id: assignment.userId,
        user_name: assignment.userName || null,
        criteria: assignment.criteria,
        phase: assignment.phase || null,
        assigned_by: assignment.assignedBy || null,
      });
      if (error) throw new Error("Error al asignar el premio");
      await refresh();
    },
    [refresh]
  );

  const getPrizesForCriteria = useCallback(
    (criteria: string) => prizes.filter((p) => p.criteria === criteria),
    [prizes]
  );

  const getAssignmentsForPrize = useCallback(
    (prizeId: string) => assignments.filter((a) => a.prizeId === prizeId),
    [assignments]
  );

  return (
    <PrizeContext.Provider
      value={{
        prizes,
        assignments,
        isLoading,
        createPrize,
        assignPrize,
        getPrizesForCriteria,
        getAssignmentsForPrize,
        refresh,
      }}
    >
      {children}
    </PrizeContext.Provider>
  );
};

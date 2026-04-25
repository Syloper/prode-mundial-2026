import React, { createContext, useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { CompanyConfig } from "../types";

interface CompanyContextType {
  company: CompanyConfig | null;
  updateCompany: (name: string) => Promise<void>;
}

export const CompanyContext = createContext<CompanyContextType | undefined>(
  undefined
);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [company, setCompany] = useState<CompanyConfig | null>(null);

  useEffect(() => {
    supabase
      .from("app_config")
      .select("value, updated_at, updated_by")
      .eq("key", "company_name")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          setCompany({
            name: data.value,
            updatedAt: data.updated_at ?? undefined,
            updatedBy: data.updated_by ?? undefined,
          });
        }
      });
  }, []);

  const updateCompany = useCallback(async (name: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const now = new Date().toISOString();
    const { error } = await supabase.from("app_config").update({
      value: name,
      updated_at: now,
      updated_by: session?.user.id ?? null,
    }).eq("key", "company_name");
    if (error) throw new Error("Error al actualizar la empresa");
    setCompany({
      name,
      updatedAt: now,
      updatedBy: session?.user.id ?? undefined,
    });
  }, []);

  return (
    <CompanyContext.Provider value={{ company, updateCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};

import React, { createContext, useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface BannerContextType {
  bannerUrl: string | null;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  publishBanner: (url: string) => Promise<void>;
  clearBanner: () => Promise<void>;
}

export const BannerContext = createContext<BannerContextType | undefined>(
  undefined
);

export const BannerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("app_config")
      .select("value")
      .eq("key", "banner_url")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setBannerUrl(data.value);
      });
  }, []);

  const publishBanner = useCallback(async (url: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("app_config").update({
      value: url,
      updated_at: new Date().toISOString(),
      updated_by: session?.user.id ?? null,
    }).eq("key", "banner_url");
    if (error) throw new Error("Error al publicar el banner");
    setBannerUrl(url);
    setPreviewUrl(null);
  }, []);

  const clearBanner = useCallback(async () => {
    const { error } = await supabase.from("app_config").update({
      value: null,
      updated_at: new Date().toISOString(),
    }).eq("key", "banner_url");
    if (error) throw new Error("Error al limpiar el banner");
    setBannerUrl(null);
    setPreviewUrl(null);
  }, []);

  return (
    <BannerContext.Provider
      value={{ bannerUrl, previewUrl, setPreviewUrl, publishBanner, clearBanner }}
    >
      {children}
    </BannerContext.Provider>
  );
};

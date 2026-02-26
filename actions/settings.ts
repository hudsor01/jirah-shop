"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  SHIPPING_COST,
  FREE_SHIPPING_THRESHOLD,
  ALLOWED_SHIPPING_COUNTRIES,
} from "@/lib/constants";
import type { ShopSettings } from "@/types/database";
import { requireAdmin } from "@/lib/auth";
import { uuidSchema, formatZodError } from "@/lib/validations";

// ─── Zod Schemas ─────────────────────────────────────────

const SettingsFormDataSchema = z.object({
  shipping_cost: z.number().min(0, "Shipping cost cannot be negative"),
  free_shipping_threshold: z.number().min(0, "Threshold cannot be negative"),
  allowed_shipping_countries: z.array(z.string().length(2, "Country code must be 2 characters")).min(1, "At least one country required"),
});

// Fallback used when the DB row hasn't been seeded yet
const DEFAULT_SETTINGS: Omit<ShopSettings, "id" | "updated_at"> = {
  shipping_cost: SHIPPING_COST,
  free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
  allowed_shipping_countries: [...ALLOWED_SHIPPING_COUNTRIES],
};

export async function getShopSettings(): Promise<ShopSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shop_settings")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    // Return safe defaults if the table row is missing
    return {
      id: "",
      ...DEFAULT_SETTINGS,
      updated_at: new Date().toISOString(),
    };
  }

  return data as ShopSettings;
}

export type SettingsFormData = {
  shipping_cost: number;
  free_shipping_threshold: number;
  allowed_shipping_countries: string[];
};

export async function updateShopSettings(
  id: string,
  formData: SettingsFormData
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return { success: false, error: "Invalid settings ID" };
  }
  const formParsed = SettingsFormDataSchema.safeParse(formData);
  if (!formParsed.success) {
    return { success: false, error: formatZodError(formParsed.error) };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("shop_settings")
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/settings");
  // Revalidate storefront pages that display shipping info
  revalidatePath("/cart");
  revalidatePath("/");

  return { success: true };
}

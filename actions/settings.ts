"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath, updateTag } from "next/cache";
import type { ShopSettings } from "@/types/database";
import { requireAdmin } from "@/lib/auth";
import { uuidSchema, formatZodError } from "@/lib/validations";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import { queryShopSettings } from "@/queries/settings";

// ─── Zod Schemas ─────────────────────────────────────────

const SettingsFormDataSchema = z.object({
  shipping_cost: z.number().min(0, "Shipping cost cannot be negative"),
  free_shipping_threshold: z.number().min(0, "Threshold cannot be negative"),
  allowed_shipping_countries: z.array(z.string().length(2, "Country code must be 2 characters")).min(1, "At least one country required"),
});

export async function getShopSettings(): Promise<ShopSettings> {
  // NOTE: This function intentionally returns raw ShopSettings (not ActionResult)
  // because it always succeeds — falling back to safe defaults when the DB row is missing.
  // Callers (e.g. checkout.ts) depend on always receiving a ShopSettings object.
  return queryShopSettings();
}

export type SettingsFormData = {
  shipping_cost: number;
  free_shipping_threshold: number;
  allowed_shipping_countries: string[];
};

export async function updateShopSettings(
  id: string,
  formData: SettingsFormData
): Promise<ActionResult<void>> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return fail("Invalid settings ID");
  }
  const formParsed = SettingsFormDataSchema.safeParse(formData);
  if (!formParsed.success) {
    return fail(formatZodError(formParsed.error));
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
    return fail(error.message);
  }

  revalidatePath("/admin/settings");
  // Revalidate storefront pages that display shipping info
  revalidatePath("/cart");
  revalidatePath("/");
  updateTag("shop-settings");

  return ok(undefined);
}

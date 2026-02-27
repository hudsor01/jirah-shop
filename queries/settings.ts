import { createClient } from "@/lib/supabase/server";
import {
  SHIPPING_COST,
  FREE_SHIPPING_THRESHOLD,
  ALLOWED_SHIPPING_COUNTRIES,
} from "@/lib/constants";
import type { ShopSettings } from "@/types/database";

// Fallback used when the DB row hasn't been seeded yet
const DEFAULT_SETTINGS: Omit<ShopSettings, "id" | "updated_at"> = {
  shipping_cost: SHIPPING_COST,
  free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
  allowed_shipping_countries: [...ALLOWED_SHIPPING_COUNTRIES],
};

export async function queryShopSettings(): Promise<ShopSettings> {
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

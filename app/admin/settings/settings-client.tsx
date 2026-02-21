"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { updateShopSettings } from "@/actions/settings";
import type { ShopSettings } from "@/types/database";

// ISO 3166-1 alpha-2 country codes that Stripe supports for shipping
const COMMON_COUNTRIES: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
];

type SettingsClientProps = {
  settings: ShopSettings;
};

export function SettingsClient({ settings }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [shippingCost, setShippingCost] = useState(
    String(settings.shipping_cost)
  );
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    String(settings.free_shipping_threshold)
  );
  const [countries, setCountries] = useState<string[]>(
    settings.allowed_shipping_countries
  );
  const [countryInput, setCountryInput] = useState("");

  function addCountry(code: string) {
    const upper = code.trim().toUpperCase();
    if (!upper || upper.length !== 2) return;
    if (countries.includes(upper)) return;
    setCountries((prev) => [...prev, upper]);
    setCountryInput("");
  }

  function removeCountry(code: string) {
    setCountries((prev) => prev.filter((c) => c !== code));
  }

  function handleSave() {
    const parsedShipping = parseFloat(shippingCost);
    const parsedThreshold = parseFloat(freeShippingThreshold);

    if (isNaN(parsedShipping) || parsedShipping < 0) {
      toast.error("Shipping cost must be a positive number.");
      return;
    }
    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      toast.error("Free shipping threshold must be a positive number.");
      return;
    }
    if (countries.length === 0) {
      toast.error("At least one shipping country is required.");
      return;
    }

    startTransition(async () => {
      const result = await updateShopSettings(settings.id, {
        shipping_cost: parsedShipping,
        free_shipping_threshold: parsedThreshold,
        allowed_shipping_countries: countries,
      });

      if (result.success) {
        toast.success("Settings saved");
      } else {
        toast.error(result.error ?? "Failed to save settings");
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Shipping Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Shipping Rates</CardTitle>
          <CardDescription>
            Set the flat shipping cost and the order total that qualifies for
            free shipping.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shipping-cost">Flat shipping cost ($)</Label>
              <Input
                id="shipping-cost"
                type="number"
                min="0"
                step="0.01"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="free-shipping">Free shipping threshold ($)</Label>
              <Input
                id="free-shipping"
                type="number"
                min="0"
                step="0.01"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Orders at or above this amount get free shipping.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Countries */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Shipping Countries</CardTitle>
          <CardDescription>
            Countries you ship to. These are shown as options in the Stripe
            checkout. Use 2-letter ISO country codes (e.g. US, GB, AU).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active countries */}
          <div className="flex flex-wrap gap-2">
            {countries.map((code) => {
              const name = COMMON_COUNTRIES.find((c) => c.code === code)?.name;
              return (
                <Badge key={code} variant="secondary" className="gap-1 pl-2.5">
                  {code}{name ? ` — ${name}` : ""}
                  <button
                    onClick={() => removeCountry(code)}
                    className="ml-1 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
                    aria-label={`Remove ${code}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              );
            })}
            {countries.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No countries selected.
              </p>
            )}
          </div>

          {/* Quick-add common countries */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Quick-add
            </p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_COUNTRIES.filter((c) => !countries.includes(c.code)).map(
                (c) => (
                  <Button
                    key={c.code}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => addCountry(c.code)}
                  >
                    <Plus className="mr-1 size-3" />
                    {c.code}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Manual entry */}
          <div className="flex gap-2">
            <Input
              placeholder="Country code (e.g. MX)"
              value={countryInput}
              onChange={(e) => setCountryInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCountry(countryInput);
                }
              }}
              maxLength={2}
              className="w-48 uppercase"
            />
            <Button
              variant="secondary"
              onClick={() => addCountry(countryInput)}
              disabled={!countryInput.trim()}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isPending} size="lg">
        {isPending ? "Saving…" : "Save Settings"}
      </Button>
    </div>
  );
}

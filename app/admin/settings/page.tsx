import { getShopSettings } from "@/actions/settings";
import { SettingsClient } from "./settings-client";

export default async function AdminSettingsPage() {
  const settings = await getShopSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Shop Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure shipping rates and delivery regions
        </p>
      </div>

      <SettingsClient settings={settings} />
    </div>
  );
}

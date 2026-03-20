import Link from "next/link";
import { NotificationSettings } from "@/components/notification-settings";
import { RefreshIntervalSettings } from "@/components/refresh-interval-settings";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <div className="w-full max-w-2xl space-y-6">
        <Link
          href="/dashboard"
          className="inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Torna alla dashboard
        </Link>

        <h1 className="text-2xl font-bold">Impostazioni</h1>

        <RefreshIntervalSettings />
        <NotificationSettings />
      </div>
    </div>
  );
}

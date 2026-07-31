import { useMemo, useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSettings, useUpdateSettings } from "../hooks/useAdministration";
import type { Setting } from "../types/administration.type";

const GROUP_LABELS: Record<string, string> = {
  general: "General",
  contact: "Contact",
  social: "Social",
  seo: "SEO",
  payment: "Payment",
  operational: "Operational",
};

/**
 * Settings are one grouped form with a single bulk save, not a table — every
 * value is edited together and written in one request.
 */
export function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  // Only the keys the admin has actually touched. Everything else reads
  // through to the saved value, so the form needs no effect to seed itself and
  // a background refetch cannot clobber an in-progress edit.
  const [edits, setEdits] = useState<Record<string, string>>({});

  const draft = useMemo<Record<string, string>>(
    () => ({
      ...Object.fromEntries((settings ?? []).map((setting) => [setting.key, setting.value ?? ""])),
      ...edits,
    }),
    [settings, edits],
  );

  const grouped = useMemo(() => {
    const groups = new Map<string, Setting[]>();
    for (const setting of settings ?? []) {
      groups.set(setting.group, [...(groups.get(setting.group) ?? []), setting]);
    }
    return [...groups.entries()];
  }, [settings]);

  const setValue = (key: string, value: string) => setEdits((previous) => ({ ...previous, [key]: value }));

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >
          Settings
        </Heading>
        <Text variant="muted">
          Site-wide configuration. Values marked Public are returned by the storefront's settings endpoint; everything
          else stays admin-only.
        </Text>
      </Box>

      {isLoading && (
        <Box className="rounded-2xl border border-border bg-card p-6">
          <Text variant="muted">Loading settings…</Text>
        </Box>
      )}

      {grouped.map(([group, rows]) => (
        <Box
          key={group}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
        >
          <Heading
            level={2}
            variant="subtitle"
          >
            {GROUP_LABELS[group] ?? group}
          </Heading>

          {rows.map((setting) => (
            <Box
              key={setting.key}
              className="flex flex-col gap-1.5"
            >
              <Box className="flex items-center gap-2">
                <Label htmlFor={`setting-${setting.key}`}>{setting.label ?? setting.key}</Label>
                {setting.is_public && (
                  <Badge
                    variant="outline"
                    className="text-success"
                  >
                    Public
                  </Badge>
                )}
              </Box>

              {setting.type === "boolean" ? (
                <Switch
                  id={`setting-${setting.key}`}
                  checked={draft[setting.key] === "1" || draft[setting.key] === "true"}
                  onCheckedChange={(checked) => setValue(setting.key, checked ? "1" : "0")}
                />
              ) : setting.type === "text" || setting.type === "json" ? (
                <Textarea
                  id={`setting-${setting.key}`}
                  rows={setting.type === "json" ? 2 : 3}
                  className="rounded-xl"
                  value={draft[setting.key] ?? ""}
                  onChange={(event) => setValue(setting.key, event.target.value)}
                />
              ) : setting.type === "image" ? (
                <Text variant="muted">
                  {draft[setting.key] ? draft[setting.key] : "No file uploaded."} — images are managed through the
                  upload endpoint.
                </Text>
              ) : (
                <Input
                  id={`setting-${setting.key}`}
                  type={setting.type === "number" ? "number" : "text"}
                  className="rounded-xl"
                  value={draft[setting.key] ?? ""}
                  onChange={(event) => setValue(setting.key, event.target.value)}
                />
              )}
            </Box>
          ))}
        </Box>
      ))}

      {grouped.length > 0 && (
        <Box className="flex justify-end">
          <Button
            type="button"
            className="rounded-xl"
            disabled={updateSettings.isPending}
            onClick={() => {
              // Image values are not editable here, so they are excluded rather
              // than written back as the path string they arrived as.
              const editable = Object.fromEntries(
                (settings ?? [])
                  .filter((setting) => setting.type !== "image")
                  .map((setting) => [setting.key, draft[setting.key] ?? ""]),
              );
              updateSettings.mutate(editable);
            }}
          >
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default SettingsPage;

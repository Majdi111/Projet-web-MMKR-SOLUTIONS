"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, BellOff, Mail, Moon, Phone, Save, Sun, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const SETTINGS_STORAGE_KEY = "mmkr.settings";

type StoredSettings = {
  displayName?: string;
  phoneNumber?: string;
  personalEmail?: string;
  notificationsEnabled?: boolean;
};

export default function SettingsPage() {
  const authState = useAuth();
  const { theme, setTheme, systemTheme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredSettings;

      if (typeof parsed.displayName === "string") setDisplayName(parsed.displayName);
      if (typeof parsed.phoneNumber === "string") setPhoneNumber(parsed.phoneNumber);
      if (typeof parsed.personalEmail === "string") setPersonalEmail(parsed.personalEmail);
      if (typeof parsed.notificationsEnabled === "boolean") setNotificationsEnabled(parsed.notificationsEnabled);
    } catch {
      // ignore malformed localStorage
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      const prev: StoredSettings = raw ? (JSON.parse(raw) as StoredSettings) : {};
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          ...prev,
          notificationsEnabled,
        })
      );
    } catch {
      // ignore storage errors (private mode, quota, etc.)
    }
  }, [notificationsEnabled]);

  const currentThemeLabel = useMemo(() => {
    if (theme === "system") return `System (${systemTheme ?? "default"})`;
    return theme ?? "system";
  }, [theme, systemTheme]);

  const darkModeEnabled = (theme ?? "system") === "dark" || (theme === "system" && systemTheme === "dark");

  const toggleDarkMode = () => {
    setTheme(darkModeEnabled ? "light" : "dark");
  };

  const toggleNotifications = () => {
    setNotificationsEnabled((prev) => !prev);
  };

  const hasUnsavedPersonalInfo = useMemo(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      const prev: StoredSettings = raw ? (JSON.parse(raw) as StoredSettings) : {};
      return (
        (prev.displayName ?? "") !== displayName ||
        (prev.phoneNumber ?? "") !== phoneNumber ||
        (prev.personalEmail ?? "") !== personalEmail
      );
    } catch {
      return true;
    }
  }, [displayName, phoneNumber, personalEmail]);

  const savePersonalInfo = async () => {
    setIsSaving(true);
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      const prev: StoredSettings = raw ? (JSON.parse(raw) as StoredSettings) : {};
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          ...prev,
          displayName,
          phoneNumber,
          personalEmail,
        })
      );
      setLastSavedAt(Date.now());
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Personalize your workspace and keep your account up to date.
        </p>
      </motion.div>

      {/* Quick Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          whileHover={{ y: -2 }}
        >
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {darkModeEnabled ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  Dark Mode
                </span>
                <span className="text-xs text-muted-foreground">{currentThemeLabel}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Switch between light and dark for better comfort.
              </p>
              <div className="flex items-center gap-3">
                <Button type="button" onClick={toggleDarkMode} className="min-w-28">
                  {darkModeEnabled ? "Disable" : "Enable"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTheme("system")}
                >
                  Use system
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          whileHover={{ y: -2 }}
        >
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  Notifications
                </span>
                <span className="text-xs text-muted-foreground">
                  {notificationsEnabled ? "Enabled" : "Disabled"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Turn alerts on/off for updates inside the app.
              </p>
              <div className="flex items-center gap-3">
                <Button type="button" onClick={toggleNotifications} className="min-w-28">
                  {notificationsEnabled ? "Disable" : "Enable"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNotificationsEnabled(true)}
                  disabled={notificationsEnabled}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Contact */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Personal email
              </Label>
              <Input
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                placeholder="your.personal@email.com"
                inputMode="email"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone number
              </Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+216 20 123 456"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                Display name
              </Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Ahmed Ben Ali"
                autoComplete="name"
              />
              <p className="text-xs text-muted-foreground">
                This name is shown across the dashboard.
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">
                {hasUnsavedPersonalInfo
                  ? "You have unsaved personal information."
                  : lastSavedAt
                  ? "Personal information saved."
                  : "No changes to save."}
              </p>
              <Button type="button" onClick={savePersonalInfo} disabled={!hasUnsavedPersonalInfo || isSaving} className="min-w-36">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </div>

            {!!authState?.user?.email && (
              <p className="text-xs text-muted-foreground">
                Signed in as {authState.user.email}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

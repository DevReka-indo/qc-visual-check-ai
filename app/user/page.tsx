"use client";

import React, { useEffect, useState } from "react";
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Clock,
  FileCheck,
  Target,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getUserProfile,
  getDashboardStats,
  updateUserProfile,
} from "@/app/actions/database";
import { updatePassword } from "@/app/actions/auth";
import { format } from "date-fns";

type Profile = {
  id: string;
  full_name: string | null;
  employee_id: string | null;
  role: string | null;
  email: string | null;
  avatar_url: string | null;
  status: string | null;
  last_login: string | null;
  divisions?: { name: string } | null;
};

type Stats = {
  total_inspections: number;
  accuracy_percentage: number;
  active_hours: number;
  pending_tasks: number;
};

type Feedback = { type: "success" | "error"; message: string } | null;

export default function UserPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);

  useEffect(() => {
    async function loadUserData() {
      setLoading(true);
      try {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();

        // Get auth user for verified email
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setAuthEmail(user.email ?? null);

          const [profileData, statsData] = await Promise.all([
            getUserProfile(user.id),
            getDashboardStats(),
          ]);

          if (profileData) {
            setProfile(profileData as Profile);
            setFullName(profileData.full_name ?? "");
          }
          if (statsData) setStats(statsData);
        }
      } catch (err) {
        console.error("Error loading user data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, []);

  // ── Save Profile ─────────────────────────────────────
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id) return;

    setIsSavingProfile(true);
    setProfileFeedback(null);

    const result = await updateUserProfile(profile.id, { full_name: fullName });

    if (result.error) {
      setProfileFeedback({ type: "error", message: result.error });
    } else {
      setProfile((prev) => (prev ? { ...prev, full_name: fullName } : prev));
      setProfileFeedback({
        type: "success",
        message: "Profil berhasil disimpan!",
      });
    }
    setIsSavingProfile(false);

    // Auto-clear feedback after 4s
    setTimeout(() => setProfileFeedback(null), 4000);
  }

  // ── Update Password ───────────────────────────────────
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordFeedback({
        type: "error",
        message: "Password baru minimal 8 karakter.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        message: "Konfirmasi password tidak cocok.",
      });
      return;
    }

    setIsUpdatingPassword(true);

    const result = await updatePassword(currentPassword, newPassword);

    if (result.error) {
      setPasswordFeedback({ type: "error", message: result.error });
    } else {
      setPasswordFeedback({
        type: "success",
        message: "Password berhasil diperbarui!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setIsUpdatingPassword(false);

    setTimeout(() => setPasswordFeedback(null), 4000);
  }

  // ── Helpers ───────────────────────────────────────────
  const displayEmail = authEmail ?? profile?.email ?? "—";
  const displayLastLogin = profile?.last_login
    ? format(new Date(profile.last_login), "dd MMM yyyy, HH:mm")
    : "—";

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "RI";

  return (
    <div className="p-6 space-y-6 font-gelasio animate-in fade-in duration-500">
      {/* ── PROFILE HEADER ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 bg-card p-6 rounded-xl border shadow-sm">
        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-lg">
            <AvatarImage
              src={profile?.avatar_url ?? undefined}
              alt="User Profile"
            />
            <AvatarFallback className="text-xl bg-primary text-primary-foreground">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                initials
              )}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight">
                  {profile?.full_name ?? "User"}
                </h1>
                <Badge
                  className={`border-transparent hover:bg-transparent ${
                    profile?.status === "online"
                      ? "bg-green-500/10 text-green-600"
                      : "bg-red-500/10 text-red-600"
                  }`}
                >
                  {profile?.status === "online" ? "Online" : "Offline"}
                </Badge>
              </>
            )}
          </div>

          <p className="text-muted-foreground flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {loading ? (
              <span className="h-4 w-40 bg-muted animate-pulse rounded inline-block" />
            ) : (
              displayEmail
            )}
          </p>

          <div className="flex gap-2 mt-2 flex-wrap">
            {loading ? (
              <div className="h-6 w-32 bg-muted animate-pulse rounded-full" />
            ) : (
              <>
                <Badge variant="outline" className="font-medium">
                  {profile?.employee_id ?? "—"}
                </Badge>
                <Badge variant="secondary" className="font-medium italic">
                  {profile?.divisions?.name ?? "No Division"}
                </Badge>
                <Badge variant="outline" className="font-medium capitalize">
                  {profile?.role ?? "operator"}
                </Badge>
              </>
            )}
          </div>
        </div>

        <div className="md:ml-auto flex gap-2">
          <Button size="sm" variant="outline">
            Unduh Report
          </Button>
        </div>
      </div>

      {/* ── STATS OVERVIEW ──────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Inspeksi
            </CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <FileCheck className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.total_inspections ?? 0}
              </div>
            )}
            <p className="text-xs text-green-500 font-medium">(Bulan ini)</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Akurasi Deteksi
            </CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <Target className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.accuracy_percentage ?? 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Standar industri: {stats?.accuracy_percentage ?? 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jam Kerja Aktif
            </CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-full">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.active_hours ?? 0} Jam
              </div>
            )}
            <p className="text-xs text-muted-foreground">Total Bulan Ini</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* ── LEFT: ACCOUNT SETTINGS ──────────────────── */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Pengaturan Akun</CardTitle>
            <CardDescription>
              Kelola detail data diri dan autentikasi Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="profile">Profil Umum</TabsTrigger>
                <TabsTrigger value="security">Keamanan</TabsTrigger>
              </TabsList>

              {/* ── Tab: Profile ── */}
              <TabsContent value="profile">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Nama Lengkap</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Masukkan nama lengkap"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        value={displayEmail}
                        disabled
                        title="Email tidak dapat diubah dari sini."
                      />
                    </div>
                    <p className="text-xs text-muted-foreground ml-1">
                      Email terhubung ke akun Supabase Auth dan tidak dapat
                      diubah di sini.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Divisi Kerja</label>
                    <Input
                      value={profile?.divisions?.name ?? "—"}
                      disabled
                      title="Divisi diatur oleh administrator."
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">ID Karyawan</label>
                    <Input
                      value={profile?.employee_id ?? "—"}
                      disabled
                      title="ID Karyawan diatur oleh administrator."
                    />
                  </div>

                  {/* Feedback */}
                  {profileFeedback && (
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg text-sm animate-in fade-in zoom-in duration-300 ${
                        profileFeedback.type === "success"
                          ? "bg-green-50 border border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-400"
                          : "bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400"
                      }`}
                    >
                      {profileFeedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      {profileFeedback.message}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full md:w-auto mt-2"
                    disabled={isSavingProfile || loading}
                  >
                    {isSavingProfile ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Menyimpan...
                      </span>
                    ) : (
                      "Simpan Perubahan"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* ── Tab: Security ── */}
              <TabsContent value="security">
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">
                      Password Sekarang
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Password Baru</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        type="password"
                        placeholder="Minimal 8 karakter"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">
                      Konfirmasi Password Baru
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        type="password"
                        placeholder="Ulangi password baru"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Feedback */}
                  {passwordFeedback && (
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg text-sm animate-in fade-in zoom-in duration-300 ${
                        passwordFeedback.type === "success"
                          ? "bg-green-50 border border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-400"
                          : "bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400"
                      }`}
                    >
                      {passwordFeedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      {passwordFeedback.message}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="destructive"
                    className="w-full md:w-auto mt-2"
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memperbarui...
                      </span>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* ── RIGHT: INFO CARDS ────────────────────────── */}
        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Status Akses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-muted-foreground">Role</span>
                {loading ? (
                  <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <Badge variant="secondary" className="capitalize">
                    {profile?.role ?? "operator"}
                  </Badge>
                )}
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-muted-foreground">
                  Tingkat Izin
                </span>
                <span className="text-sm font-medium">Read & Write</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-muted-foreground">Status</span>
                {loading ? (
                  <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  <Badge
                    className={`border-transparent ${
                      profile?.status === "online"
                        ? "bg-green-500/10 text-green-600"
                        : "bg-slate-500/10 text-slate-600"
                    }`}
                  >
                    {profile?.status === "online" ? "Online" : "Offline"}
                  </Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Terakhir Login
                </span>
                {loading ? (
                  <div className="h-4 w-36 bg-muted animate-pulse rounded" />
                ) : (
                  <span className="text-sm font-medium">
                    {displayLastLogin}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Anomali Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 bg-muted animate-pulse rounded"
                    />
                  ))}
                </div>
              ) : stats && stats.pending_tasks > 0 ? (
                <div className="flex flex-col items-center justify-center py-4 gap-2 text-amber-600">
                  <div className="text-4xl font-bold">
                    {stats.pending_tasks}
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Inspeksi menunggu validasi manual
                  </p>
                  <a
                    href="/detection-result"
                    className="text-xs text-primary hover:underline font-medium mt-1"
                  >
                    Lihat Detection Result →
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium">
                    Semua inspeksi sudah diverifikasi
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

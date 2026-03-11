"use client";

import React, { useEffect, useState } from "react";
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Clock,
  Lock,
  Camera,
  CheckCircle2,
  AlertCircle,
  LogOut,
  CreditCard,
  FileCheck,
  Target,
  KeyRound,
  Loader2,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

import { useAuthStore } from "@/store/use-auth-store";
import { useStatsStore } from "@/store/use-stats-store";
import { AvatarUpload } from "@/components/AvatarUpload";
import { WorkHoursCard } from "@/components/WorkHoursCard";
import {
  updateUserProfile,
  getDivisions,
} from "@/app/actions/database";
import { updatePassword } from "@/app/actions/auth";

type Division = {
  id: string;
  name: string;
};

// ─── Types ───────────────────────────────────────────────────
type Feedback = { type: "success" | "error"; message: string } | null;

// ─── Component ───────────────────────────────────────────────
export default function UserPage() {
  // ── Global stores ───────────────────────────────────────────
  const {
    profile,
    authEmail,
    isLoading: authLoading,
    updateProfile,
  } = useAuthStore();
  const { stats, isLoading: statsLoading, fetchAll } = useStatsStore();

  const loading = authLoading || statsLoading;

  const [fullName, setFullName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [divisionId, setDivisionId] = useState<string | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);

  // ── Password form state ─────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);

  // ── Seed form when profile loads ────────────────────────────
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setEmployeeId(profile.employee_id ?? "");
      setDivisionId(profile.division_id);
    }
  }, [profile]);

  // ── Fetch divisions ──────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      const data = await getDivisions();
      setDivisions(data as Division[]);
    };
    fetch();
  }, []);

  // ── Fetch stats on mount (uses TTL cache, won't double-fetch) ──
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Helpers ─────────────────────────────────────────────────
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

  // ── Save Profile ─────────────────────────────────────────────
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id) return;

    setIsSavingProfile(true);
    setProfileFeedback(null);

    const result = await updateUserProfile(profile.id, {
      full_name: fullName,
      division_id: divisionId,
    });

    if (result.error) {
      setProfileFeedback({ type: "error", message: result.error });
    } else {
      // Find the selected division object to update the store with full details
      const selectedDivision = divisions.find((d) => d.id === divisionId);
      
      updateProfile({
        full_name: fullName,
        division_id: divisionId,
        divisions: selectedDivision ? { ...selectedDivision, description: null, color_code: null, created_at: null } : null,
      });
      
      setProfileFeedback({
        type: "success",
        message: "Profil berhasil disimpan!",
      });
    }

    setIsSavingProfile(false);
    setTimeout(() => setProfileFeedback(null), 4000);
  }

  // ── Update Password ──────────────────────────────────────────
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

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-4 md:space-y-6 font-gelasio animate-in fade-in duration-500 w-full max-w-[1600px] mx-auto pb-10">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif">
          User Profile
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Kelola profil, keamanan akun, dan statistik aktivitas Anda.
        </p>
      </div>

      {/* ── PROFILE HEADER ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 bg-card p-4 md:p-6 rounded-xl border shadow-sm">
        <div className="relative shrink-0">
          <AvatarUpload 
            userId={profile?.id || ""} 
            currentAvatarUrl={profile?.avatar_url || null}
            name={profile?.full_name || null}
            onUploadSuccess={(url) => {
              updateProfile({ avatar_url: url });
              updateUserProfile(profile?.id || "", { avatar_url: url });
            }}
          />
        </div>

        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            {authLoading ? (
              <div className="h-7 md:h-8 w-40 md:w-48 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <h2 className="text-xl md:text-3xl font-bold tracking-tight truncate">
                  {profile?.full_name ?? "User"}
                </h2>
                <Badge
                  className={`border-transparent hover:bg-transparent text-[10px] md:text-xs ${
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

          <p className="text-muted-foreground flex items-center gap-1.5 text-xs md:text-sm">
            <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
            {authLoading ? (
              <span className="h-4 w-40 bg-muted animate-pulse rounded inline-block" />
            ) : (
              <span className="truncate">{displayEmail}</span>
            )}
          </p>

          <div className="flex gap-1.5 md:gap-2 mt-1.5 md:mt-2 flex-wrap">
            {authLoading ? (
              <div className="h-5 md:h-6 w-32 bg-muted animate-pulse rounded-full" />
            ) : (
              <>
                <Badge
                  variant="outline"
                  className="font-medium text-[10px] md:text-xs"
                >
                  {profile?.employee_id ?? "—"}
                </Badge>
                <Badge
                  variant="secondary"
                  className="font-medium italic text-[10px] md:text-xs"
                >
                  {profile?.divisions?.name ?? "No Division"}
                </Badge>
                <Badge
                  variant="outline"
                  className="font-medium capitalize text-[10px] md:text-xs"
                >
                  {profile?.role ?? "operator"}
                </Badge>
              </>
            )}
          </div>
        </div>

        <div className="sm:ml-auto shrink-0">
          <Button size="sm" variant="outline" className="text-xs md:text-sm">
            Unduh Report
          </Button>
        </div>
      </div>

      {/* ── STATS OVERVIEW ──────────────────────────────────── */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Inspeksi
            </CardTitle>
            <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-full shrink-0">
              <FileCheck className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6">
            {statsLoading ? (
              <div className="h-7 md:h-8 w-14 md:w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-xl md:text-2xl font-bold">
                {stats?.total_inspections ?? 0}
              </div>
            )}
            <p className="text-[10px] md:text-xs text-green-500 font-medium mt-1">
              (Bulan ini)
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Akurasi Deteksi
            </CardTitle>
            <div className="p-1.5 md:p-2 bg-green-500/10 rounded-full shrink-0">
              <Target className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6">
            {statsLoading ? (
              <div className="h-7 md:h-8 w-14 md:w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-xl md:text-2xl font-bold">
                {stats?.accuracy_percentage ?? 0}%
              </div>
            )}
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              Standar industri: {stats?.accuracy_percentage ?? 0}%
            </p>
          </CardContent>
        </Card>

        <WorkHoursCard 
          activeHours={stats?.active_hours ?? 0} 
          isLoading={statsLoading} 
        />
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-7">
        {/* ── LEFT: ACCOUNT SETTINGS ────────────────────── */}
        <Card className="md:col-span-4">
          <CardHeader className="px-4 pt-4 pb-2 md:px-6 md:pt-6">
            <CardTitle className="text-base md:text-lg">
              Pengaturan Akun
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
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
                <form
                  onSubmit={handleSaveProfile}
                  className="space-y-3 md:space-y-4"
                >
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
                    <Select
                      value={divisionId ?? "none"}
                      onValueChange={(val) => setDivisionId(val === "none" ? null : val)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Divisi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tanpa Divisi</SelectItem>
                        {divisions.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">ID Karyawan</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        value={employeeId}
                        disabled
                        title="ID Karyawan diatur secara otomatis oleh sistem."
                      />
                    </div>
                    <p className="text-xs text-muted-foreground ml-1">
                      ID Karyawan diatur secara otomatis oleh sistem dan tidak
                      dapat diubah.
                    </p>
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
                    className="w-full md:w-auto mt-2 text-sm"
                    disabled={isSavingProfile || authLoading}
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
                    className="w-full md:w-auto mt-2 text-sm"
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

        {/* ── RIGHT: INFO CARDS ──────────────────────────── */}
        <div className="md:col-span-3 space-y-4 md:space-y-6">
          {/* Access Status */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 md:px-6 md:pt-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                Status Akses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 px-4 pb-4 md:px-6">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs md:text-sm text-muted-foreground">
                  Role
                </span>
                {authLoading ? (
                  <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <Badge variant="secondary" className="capitalize text-xs">
                    {profile?.role ?? "operator"}
                  </Badge>
                )}
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs md:text-sm text-muted-foreground">
                  Tingkat Izin
                </span>
                <span className="text-xs md:text-sm font-medium">
                  Read & Write
                </span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs md:text-sm text-muted-foreground">
                  Status
                </span>
                {authLoading ? (
                  <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  <Badge
                    className={`border-transparent text-xs ${
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
                <span className="text-xs md:text-sm text-muted-foreground">
                  Terakhir Login
                </span>
                {authLoading ? (
                  <div className="h-4 w-36 bg-muted animate-pulse rounded" />
                ) : (
                  <span className="text-xs md:text-sm font-medium">
                    {displayLastLogin}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Anomalies */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 md:px-6 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Anomali Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6">
              {statsLoading ? (
                <div className="space-y-2 md:space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-8 md:h-10 bg-muted animate-pulse rounded"
                    />
                  ))}
                </div>
              ) : stats && stats.pending_tasks > 0 ? (
                <div className="flex flex-col items-center justify-center py-3 md:py-4 gap-2 text-amber-600">
                  <div className="text-3xl md:text-4xl font-bold">
                    {stats.pending_tasks}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground text-center">
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
                <div className="flex flex-col items-center justify-center py-4 md:py-6 gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-7 w-7 md:h-8 md:w-8 text-green-500" />
                  <p className="text-xs md:text-sm font-medium text-center">
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

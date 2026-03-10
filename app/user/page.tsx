"use client"

import React, { useEffect, useState } from "react"
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Clock,
  FileCheck,
  Target,
  KeyRound,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getDashboardStats } from "@/app/actions/database"

export default function UserPage() {
  const [stats, setStats] = useState<{ total_inspections: number, accuracy_percentage: number, active_hours: number, pending_tasks: number } | null>(null)

  useEffect(() => {
    getDashboardStats().then(data => {
      if (data) setStats(data)
    })
  }, [])

  return (
    <div className="p-6 space-y-6 font-gelasio animate-in fade-in duration-500">

      {/* BAGIAN 2: UPDATE HEADER PROFIL (YANG ADA FOTONYA) */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 bg-card p-6 rounded-xl border shadow-sm">
        <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-lg">
          <AvatarImage src="https://github.com/shadcn.png" alt="User Profile" />
          <AvatarFallback className="text-xl bg-primary text-primary-foreground">RI</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Mr.Reka</h1>
            <Badge className="bg-red-500/10 text-black-600 border-red-500/20 hover:bg-red-500/10">
              Offline
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Mail className="h-4 w-4" /> user@rekainka.co.id
          </p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="font-medium">REKA-QC-091</Badge>
            <Badge variant="secondary" className="font-medium italic">Final Electric Division</Badge>
          </div>
        </div>

        <div className="md:ml-auto flex gap-2">
          <Button variant="outline" size="sm">Edit Profil</Button>
          <Button size="sm">Unduh Report</Button>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Inspeksi</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <FileCheck className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="text-2xl font-bold">{stats.total_inspections}</div>
            ) : <Loader2 className="w-5 h-5 animate-spin" />}
            <p className="text-xs text-green-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis w-full max-w-full truncate block">(Bulan ini)</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Akurasi Deteksi</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <Target className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="text-2xl font-bold">{stats.accuracy_percentage}%</div>
            ) : <Loader2 className="w-5 h-5 animate-spin" />}
            <p className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis w-full max-w-full truncate block">Standar industri: {stats ? stats.accuracy_percentage : '0'}%</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jam Kerja Aktif</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-full">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="text-2xl font-bold">{stats.active_hours} Jam</div>
            ) : <Loader2 className="w-5 h-5 animate-spin" />}
            <p className="text-xs text-muted-foreground">Total Bulan Ini</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* LEFT COLUMN: MAIN SETTINGS */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Pengaturan Akun</CardTitle>
            <CardDescription>Kelola detail data diri dan autentikasi Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="profile">Profil Umum</TabsTrigger>
                <TabsTrigger value="security">Keamanan</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Nama Lengkap</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" defaultValue="User Reka Inka" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" defaultValue="user@rekainka.co.id" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Divisi Kerja</label>
                  <Input defaultValue="Quality Control - Final Electric" disabled />
                </div>
                <Button className="w-full md:w-auto mt-2">Simpan Perubahan</Button>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Password Sekarang</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Password Baru</label>
                  <Input type="password" placeholder="Minimal 8 karakter" />
                </div>
                <Button variant="destructive" className="w-full md:w-auto mt-2">Update Password</Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: ADDITIONAL INFO */}
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
                <Badge variant="secondary">System Operator</Badge>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-muted-foreground">Tingkat Izin</span>
                <span className="text-sm font-medium">Read & Write</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Terakhir Login</span>
                <span className="text-sm font-medium">Hari ini, 08:30 WIB</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Aktivitas Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "Inspeksi Selesai", target: "BG-2026-0088", time: "2 jam yang lalu" },
                  { action: "Input Database", target: "Part-INC-02", time: "5 jam yang lalu" },
                  { action: "Login Berhasil", target: "Sistem Web", time: "8 jam yang lalu" }
                ].map((log, i) => (
                  <div key={i} className="flex items-start gap-3 border-l-2 border-primary/20 pl-4 py-1">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium leading-none">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.target} • {log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
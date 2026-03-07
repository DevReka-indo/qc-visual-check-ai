"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Upload, FileImage, AlertCircle, CheckCircle2, ScanLine, Clock, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function HomePage() {
  const router = useRouter()

  // --- STATE MANAGEMENT ---
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [result, setResult] = useState<{ status: "okay" | "not_okay"; reason?: string } | null>(null)
  const [confidence, setConfidence] = useState<number>(0)
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  // New States untuk UI Modern
  const [isDragging, setIsDragging] = useState(false)
  const [defectBox, setDefectBox] = useState<{ top: number, left: number, width: number, height: number } | null>(null)
  const [recentDetections, setRecentDetections] = useState([
    { id: "BG-1092", status: "okay", time: "2 mins ago" },
    { id: "BG-1091", status: "not_okay", time: "15 mins ago" },
  ])

  // --- LOGIKA PROTEKSI LOGIN ---
  useEffect(() => {
    const loginStatus = localStorage.getItem("isLoggedIn")
    if (loginStatus !== "true") {
      router.push('/auth')
    } else {
      setIsAuthorized(true)
    }
  }, [router])

  // --- EFFECT UNTUK GENERATE ANGKA RANDOM ---
  useEffect(() => {
    if (isAuthorized) {
      const randomVal = Number((Math.random() * 10 + 89).toFixed(1))
      setConfidence(randomVal)
    }
  }, [result, isAuthorized])

  // --- HANDLERS ---
  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file)
      setSelectedImage(imageUrl)
      setResult(null)
      setDefectBox(null)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleDetection = () => {
    if (!selectedImage) return
    setIsDetecting(true)
    setResult(null)
    setDefectBox(null)

    // Simulasi Deep Learning Process
    setTimeout(() => {
      setIsDetecting(false)
      const isOkay = Math.random() > 0.5
      
      if (isOkay) {
        setResult({ status: "okay" })
        setRecentDetections(prev => [{ id: `BG-${Math.floor(Math.random() * 9000) + 1000}`, status: "okay", time: "Just now" }, ...prev].slice(0, 3))
      } else {
        const defects = ["Terdeteksi Baret", "Terdeteksi Lengkung", "Terdeteksi Cat Meleber"]
        const randomDefect = defects[Math.floor(Math.random() * defects.length)]
        setResult({ status: "not_okay", reason: randomDefect })
        
        // Generate random bounding box (dalam persentase agar responsif)
        setDefectBox({
          top: Math.floor(Math.random() * 40) + 20,
          left: Math.floor(Math.random() * 40) + 20,
          width: Math.floor(Math.random() * 20) + 15,
          height: Math.floor(Math.random() * 20) + 15,
        })
        
        setRecentDetections(prev => [{ id: `BG-${Math.floor(Math.random() * 9000) + 1000}`, status: "not_okay", time: "Just now" }, ...prev].slice(0, 3))
      }
    }, 2500)
  }

  if (!isAuthorized) return null

  // Warna dinamis untuk Card Hasil
  const resultCardClass = result 
    ? result.status === "okay" 
      ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
      : "border-destructive/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
    : "border-sidebar-border"

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-500">
      
      {/* CSS Animasi Scanner (Disisipkan agar mudah tanpa config tailwind tambahan) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}} />

      <div>
        <h1 className="text-3xl font-bold tracking-tight font-serif">Workspace Deteksi</h1>
        <p className="text-muted-foreground mt-2">
          Upload struktur bawah bogie kereta (Train Bogie Base) untuk dianalisis oleh AI.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* INPUT CARD - DENGAN DRAG & DROP */}
        <Card className="flex flex-col border-sidebar-border shadow-sm overflow-hidden relative">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-primary" />
              Vision Scanner
            </CardTitle>
            <CardDescription>Drag & drop gambar atau klik untuk memilih file.</CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 p-6">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative w-full min-h-[350px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all duration-200 overflow-hidden ${
                isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 
                selectedImage ? 'border-transparent bg-slate-900/5 dark:bg-slate-900/50' : 'border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/50 cursor-pointer'
              }`}
            >
              {selectedImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-2 group">
                  <img src={selectedImage} alt="Uploaded bogie" className="max-h-[300px] object-contain rounded-md shadow-sm z-10" />
                  
                  {/* Efek Scanning Laser */}
                  {isDetecting && (
                    <div className="absolute inset-0 z-20 overflow-hidden rounded-md pointer-events-none">
                      <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>
                      <div className="absolute w-full h-1 bg-[#0d6efd] shadow-[0_0_8px_2px_rgba(13,110,253,0.8)] animate-scan left-0"></div>
                    </div>
                  )}

                  {/* Bounding Box Hasil Deteksi */}
                  {defectBox && result?.status === "not_okay" && (
                    <div 
                      className="absolute z-20 border-2 border-destructive bg-destructive/20 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-500 ease-out animate-in zoom-in-50"
                      style={{
                        top: `${defectBox.top}%`,
                        left: `${defectBox.left}%`,
                        width: `${defectBox.width}%`,
                        height: `${defectBox.height}%`,
                      }}
                    >
                      <Badge variant="destructive" className="absolute -top-3 -left-1 text-[10px] px-1 py-0 shadow-md">
                        {result.reason}
                      </Badge>
                    </div>
                  )}

                  {/* Layer Transparan untuk Klik Ulang (Ganti Gambar) */}
                  {!isDetecting && (
                    <label className="absolute inset-0 cursor-pointer w-full h-full z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity rounded-md">
                      <span className="bg-background text-foreground px-4 py-2 rounded-lg font-medium shadow-lg flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Ganti Gambar
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              ) : (
                <>
                  <label className="absolute inset-0 cursor-pointer z-10 w-full h-full">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <div className="p-4 bg-primary/10 rounded-full text-primary mb-4 pointer-events-none">
                    <Upload className="w-10 h-10" />
                  </div>
                  <div className="text-center pointer-events-none space-y-1">
                    <p className="text-base font-semibold">Tarik gambar ke sini</p>
                    <p className="text-sm text-muted-foreground">atau klik untuk menelusuri folder</p>
                    <Badge variant="secondary" className="mt-4">PNG, JPG, JPEG (Max 10MB)</Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t p-4 bg-muted/10 gap-4">
            <Button variant="outline" onClick={() => { setSelectedImage(null); setResult(null); setDefectBox(null); }} disabled={!selectedImage || isDetecting} className="w-24">
              Clear
            </Button>
            <Button onClick={handleDetection} disabled={!selectedImage || isDetecting} className="flex-1 bg-[#0d6efd] hover:bg-blue-700 shadow-md transition-all hover:scale-[1.01]">
              {isDetecting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menganalisis...
                </span>
              ) : "Jalankan Deteksi AI"}
            </Button>
          </CardFooter>
        </Card>

        {/* KOLOM KANAN: HASIL & AKTIVITAS */}
        <div className="flex flex-col gap-6">
          
          {/* ANALYSIS RESULT CARD */}
          <Card className={`flex flex-col transition-all duration-500 ${resultCardClass}`}>
            <CardHeader>
              <CardTitle>Hasil Inspeksi</CardTitle>
              <CardDescription>Output deteksi dari model Deep Learning.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {isDetecting ? (
                <div className="flex flex-col items-center justify-center h-[200px] space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-muted rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-[#0d6efd] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="text-sm font-medium animate-pulse text-[#0d6efd]">Memproses bobot model AI...</p>
                </div>
              ) : result ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className={`flex items-center justify-between p-5 border rounded-xl ${result.status === "okay" ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
                    <div className="flex items-center gap-4">
                      {result.status === "okay" ? (
                        <div className="p-2 bg-emerald-500/20 rounded-full">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="p-2 bg-destructive/20 rounded-full">
                          <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-lg">Status Akhir</p>
                        <p className="text-sm text-muted-foreground">Integritas Struktur Bogie</p>
                      </div>
                    </div>
                    <Badge variant={result.status === "okay" ? "outline" : "destructive"} className={`text-base px-4 py-2 shadow-sm ${result.status === "okay" ? "bg-emerald-500 text-white border-transparent" : "animate-pulse"}`}>
                      {result.status === "okay" ? "PASSED (OK)" : "REJECT (NOK)"}
                    </Badge>
                  </div>

                  {result.status === "not_okay" && (
                    <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive">
                      <ShieldAlert className="h-5 w-5" />
                      <AlertTitle className="font-bold text-base ml-2">Anomali Terdeteksi!</AlertTitle>
                      <AlertDescription className="mt-2 text-sm leading-relaxed ml-2">
                        Sistem mendeteksi <span className="font-bold underline">{result.reason}</span> pada area yang ditandai merah (kiri). Harap segera lakukan peninjauan fisik.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3 p-5 bg-muted/20 rounded-xl border border-muted-foreground/10">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-muted-foreground">Confidence Level (Akurasi)</h4>
                      <p className={`text-lg font-bold ${result.status === "okay" ? "text-emerald-500" : "text-destructive"}`}>
                        {confidence}%
                      </p>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out ${result.status === "okay" ? "bg-emerald-500" : "bg-destructive"}`} 
                        style={{ width: `${confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground/50 space-y-4">
                  <FileImage className="w-16 h-16 opacity-30" />
                  <p className="text-sm font-medium">Menunggu input gambar...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RECENT ACTIVITY CARD */}
          <Card className="border-sidebar-border shadow-sm">
            <CardHeader className="py-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Aktivitas Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 pb-4">
              <div className="space-y-3">
                {recentDetections.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.status === "okay" ? "bg-emerald-500" : "bg-destructive"}`}></div>
                      <span className="text-sm font-medium">{item.id}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
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
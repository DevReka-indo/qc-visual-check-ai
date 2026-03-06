"use client"

import React, { useState } from "react"
import { Upload, FileImage, AlertCircle, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function HomePage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [result, setResult] = useState<{ status: "okay" | "not_okay"; reason?: string } | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setSelectedImage(imageUrl)
      setResult(null)
    }
  }

  const handleDetection = () => {
    if (!selectedImage) return
    setIsDetecting(true)

    // Mock simulation of detection
    setTimeout(() => {
      setIsDetecting(false)
      // Randomly decide okay or not okay for demo purposes
      const isOkay = Math.random() > 0.5
      if (isOkay) {
        setResult({ status: "okay" })
      } else {
        const defects = ["Terdeteksi Baret", "Terdeteksi Lengkung", "Terdeteksi Cat Meleber"]
        const randomDefect = defects[Math.floor(Math.random() * defects.length)]
        setResult({ status: "not_okay", reason: randomDefect })
      }
    }, 2000)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-serif">Home</h1>
        <p className="text-muted-foreground mt-2">
          Upload an image of a train bogie base structure to analyze it for physical anomalies.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Input Image</CardTitle>
            <CardDescription>Upload a clear, well-lit photo of the train bogie.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-6 min-h-[300px] border-2 border-dashed rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors mx-6 mb-6 relative">
            {selectedImage ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedImage} alt="Uploaded bogie" className="max-h-[250px] object-contain rounded-md shadow-sm" />
                <label className="absolute inset-0 cursor-pointer w-full h-full opacity-0">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full space-y-4">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload image</p>
                  <p className="text-sm text-muted-foreground mt-1">PNG, JPG or JPEG (max. 10MB)</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6 mt-auto">
            <Button variant="outline" onClick={() => { setSelectedImage(null); setResult(null); }} disabled={!selectedImage || isDetecting}>
              Clear
            </Button>
            <Button onClick={handleDetection} disabled={!selectedImage || isDetecting}>
              {isDetecting ? "Analyzing Image..." : "Run Detection Engine"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
            <CardDescription>Detection output from the deep learning model.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {isDetecting ? (
              <div className="flex flex-col items-center justify-center h-[200px] space-y-4 mt-10">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium animate-pulse text-muted-foreground">Running inference models...</p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                <div className={`flex items-center justify-between p-4 border rounded-lg ${result.status === "okay" ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
                  <div className="flex items-center gap-3">
                    {result.status === "okay" ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    )}
                    <div>
                      <p className="font-semibold text-lg">Overall Status</p>
                      <p className="text-sm text-muted-foreground text-balance">Bogie structural integrity</p>
                    </div>
                  </div>
                  <Badge variant={result.status === "okay" ? "outline" : "destructive"} className={`text-base px-4 py-1.5 shadow-sm`}>
                    {result.status === "okay" ? "OKAY" : "NOT OKAY"}
                  </Badge>
                </div>

                {result.status === "not_okay" && (
                  <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Anomaly Detected</AlertTitle>
                    <AlertDescription className="mt-2 text-sm">
                      Model detected <span className="font-bold underline">{result.reason}</span> on the uploaded image. Please review carefully and schedule maintenance immediately.
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Model Confidence</h4>
                    <p className="text-sm font-bold text-primary">{(Math.random() * 10 + 89).toFixed(1)}%</p>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${Math.floor(Math.random() * 10) + 89}%` }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground">High confidence score indicates reliable result based on previous training data.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-muted-foreground space-y-4">
                <FileImage className="w-16 h-16 opacity-20" />
                <p>Upload an image and run detection to see results here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

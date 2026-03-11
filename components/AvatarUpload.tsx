"use client";

import React, { useState, useRef } from "react";
import Cropper, { Point, Area } from "react-easy-crop";
import { Camera, Loader2, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCroppedImg } from "@/lib/crop-image";
import { createClient } from "@/utils/supabase/client";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  name: string | null;
  onUploadSuccess: (url: string) => void;
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  name,
  onUploadSuccess,
}: AvatarUploadProps) {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImage(reader.result as string);
        setIsDialogOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (restoredArea: Area, restoredAreaPixels: Area) => {
    setCroppedAreaPixels(restoredAreaPixels);
  };

  const handleUpload = async () => {
    if (!image || !croppedAreaPixels) return;

    try {
      setIsUploading(true);
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      const fileExt = "jpg";
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedBlob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      onUploadSuccess(publicUrl);
      setIsDialogOpen(false);
      setImage(null);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Gagal mengunggah foto profil.");
    } finally {
      setIsUploading(false);
    }
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
          <AvatarImage src={currentAvatarUrl || ""} />
          <AvatarFallback className="text-xl font-bold bg-muted">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-8 w-8 text-white" />
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={onFileChange}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Sesuaikan Foto Profil</DialogTitle>
          </DialogHeader>
          
          <div className="relative h-[300px] w-full bg-muted mt-4">
            {image && (
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setImage(null);
              }}
              disabled={isUploading}
            >
              Batal
            </Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Simpan Foto
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

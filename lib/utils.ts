import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFriendlyAuthError(errorMsg: string): string {
  if (errorMsg.includes("Invalid login credentials")) {
    return "Email atau password salah. Silakan coba lagi.";
  }
  if (errorMsg.includes("Email not confirmed")) {
    return "Email belum dikonfirmasi. Silakan cek kotak masuk email Anda.";
  }
  if (errorMsg.includes("User already registered")) {
    return "Email ini sudah terdaftar. Silakan login atau gunakan email lain.";
  }
  if (errorMsg.includes("Password should be at least 6 characters")) {
    return "Password minimal harus 6 karakter.";
  }
  if (errorMsg.includes("No user found")) {
    return "Akun tidak ditemukan. Silakan register terlebih dahulu.";
  }
  if (errorMsg.includes("Too many requests")) {
    return "Terlalu banyak percobaan login. Silakan tunggu beberapa saat lagi.";
  }
  if (errorMsg.includes("Database error saving new user")) {
    return "Terjadi kesalahan sistem saat mendaftar. Silakan coba lagi nanti.";
  }
  
  return errorMsg; // Fallback to original if not mapped
}

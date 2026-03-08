"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Lock, User, Info } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  // State form login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // STATE BARU: Untuk mengontrol pop-up modal register
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const VALID_USERNAME = "admin";
  const VALID_PASSWORD = "12";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        localStorage.setItem("isLoggedIn", "true");
        router.push('/');
      } else {
        setError("Username atau Password salah!");
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div 
      className="fixed inset-0 w-full h-full flex items-center justify-center bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-team.jpg')" }}
    >
      {/* Overlay Gelap */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>

      {/* --- CARD LOGIN UTAMA --- */}
      <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-sm z-10 border border-white/20">
        
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight font-serif">Sign-In</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium italic">Image Processing System</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-in fade-in zoom-in duration-300">
            <AlertCircle className="size-4" />
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-5">
          {/* USERNAME INPUT */}
          <div className="space-y-1.5">
            <label className="text-gray-700 text-sm font-semibold ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                /* FIX: Menambahkan text-gray-900 agar tulisan tidak putih di link web */
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-gray-900 placeholder:text-gray-400"
                placeholder="admin"
              />
            </div>
          </div>
          
          {/* PASSWORD INPUT */}
          <div className="space-y-1.5">
            <label className="text-gray-700 text-sm font-semibold ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                /* FIX: Menambahkan text-gray-900 agar tulisan tidak putih di link web */
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-gray-900 placeholder:text-gray-400"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#0d6efd] hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] mt-2 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : "SIGN IN"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Belum punya account?{' '}
            <button 
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="text-[#0d6efd] font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
            >
              Register
            </button>
          </p>
        </div>
        
        <div className="mt-4 text-[10px] text-gray-400 text-center uppercase tracking-widest">
          © 2026 REKA INKA Group
        </div>
      </div>

      {/* --- POP-UP MODAL REGISTER --- */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4 border-4 border-blue-100">
                <Info className="size-6 text-[#0d6efd]" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Coming Soon!</h3>
              <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                Fitur pendaftaran (Register) sedang dalam tahap pengembangan. <br/> <span className="font-semibold italic">To be continued...</span>
              </p>
              
              <button
                onClick={() => setShowRegisterModal(false)}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-xl transition-all"
              >
                Oke, Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Lock, User, Mail, CreditCard, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from 'next/link';
import { signUp } from '@/app/actions/auth';

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedId, setGeneratedId] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Generate random Employee ID on mount
    React.useEffect(() => {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setGeneratedId(`REKA-QC-${randomNum}`);
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        // Ensure the generated ID is included
        formData.set('employeeId', generatedId);

        const result = await signUp(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        }
    }

    return (
        <div
            className="fixed inset-0 w-full h-full flex items-center justify-center bg-no-repeat bg-cover bg-center"
            style={{ backgroundImage: "url('/bg-team.jpg')" }}
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>

            <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-sm z-10 border border-white/20">

                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight font-serif">Register</h2>
                    <p className="text-sm text-gray-500 mt-2 font-medium italic">Create an Account</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                        <AlertCircle className="size-4" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-gray-700 text-sm font-semibold ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <input
                                name="fullName"
                                type="text"
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-gray-900"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-gray-700 text-sm font-semibold ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-gray-900"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-gray-700 text-sm font-semibold ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-gray-900"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#0d6efd] hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] mt-2 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : "REGISTER"}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <Link href="/auth" className="text-sm text-gray-600 flex items-center justify-center gap-1 hover:text-[#0d6efd] transition-colors">
                        <ArrowLeft className="size-3" /> Kembali ke Login
                    </Link>
                </div>

                <div className="mt-4 text-[10px] text-gray-400 text-center uppercase tracking-widest">
                    © 2026 REKA INKA Group
                </div>
            </div>
        </div>
    );
}

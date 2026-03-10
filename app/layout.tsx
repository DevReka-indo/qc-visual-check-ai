'use client'; // WAJIB: Agar kita bisa menggunakan usePathname

import { usePathname } from "next/navigation"; // Import ini untuk deteksi URL
import { DM_Sans, Noto_Serif, Gelasio } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
});

const gelasio = Gelasio({
  variable: "--font-gelasio",
  subsets: ["latin"],
});

// CATATAN PENTING: Metadata harus dipindahkan ke file page.tsx masing-masing 
// atau dihapus dari sini karena file ini sekarang menggunakan 'use client'.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname(); // Mengambil alamat URL saat ini

  // Cek apakah user sedang berada di halaman login (/auth)
  const isAuthPage = pathname === "/auth" || pathname === "/register";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${notoSerif.variable} ${gelasio.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* LOGIKA KONDISIONAL DIMULAI DI SINI */}
          {isAuthPage ? (
            // Tampilan jika di halaman LOGIN: Tanpa Sidebar, Tanpa Header
            <main className="min-h-screen">
              {children}
            </main>
          ) : (
            // Tampilan jika di DASHBOARD: Menggunakan kodingan asli kamu lengkap dengan Sidebar
            <SidebarProvider>
              <AppSidebar />
              <div className="flex w-full flex-col border-l border-sidebar-border/50">
                <header className="flex h-16 items-center gap-4 border-b px-4 lg:px-6 w-full shrink-0 justify-between">
                  <div className="flex flex-1 items-center gap-2">
                    <SidebarTrigger />
                  </div>
                  <div className="flex items-center gap-2">
                    <ModeToggle />
                  </div>
                </header>
                <main className="flex-1 overflow-auto bg-background p-4 md:p-6">
                  {children}
                </main>
              </div>
            </SidebarProvider>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
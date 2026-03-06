import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        </ThemeProvider>
      </body>
    </html>
  );
}

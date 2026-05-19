"use client";

import { usePathname } from "next/navigation";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/use-auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  useAuth();

  const profile = useAuthStore((s) => s.profile);
  const authEmail = useAuthStore((s) => s.authEmail);
  const isLoading = useAuthStore((s) => s.isLoading);

  const isAuthPage = pathname === "/auth" || pathname === "/register";

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : authEmail
      ? authEmail[0].toUpperCase()
      : "RI";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {isAuthPage ? (
            <main className="min-h-screen">{children}</main>
          ) : (
            <SidebarProvider>
              <AppSidebar />
              <div className="flex w-full flex-col border-l border-sidebar-border/50 min-w-0">
                <header className="flex h-16 items-center gap-4 border-b px-4 lg:px-6 w-full shrink-0 justify-between">
                  {/* Left: sidebar trigger */}
                  <div className="flex items-center gap-2">
                    <SidebarTrigger />
                  </div>

                  {/* Right: dark mode toggle + user info */}
                  <div className="flex items-center gap-3">
                    <ModeToggle />

                    {!isLoading && (profile || authEmail) && (
                      <div className="flex items-center gap-2.5 border-l border-border pl-3">
                        {/* Name + role — hidden on xs, visible from sm */}
                        <div className="hidden sm:flex flex-col items-end leading-none gap-0.5">
                          <span className="text-sm font-semibold text-foreground truncate max-w-[140px]">
                            {profile?.full_name ?? authEmail ?? "User"}
                          </span>
                          <span className="text-[11px] text-muted-foreground capitalize">
                            {profile?.role ?? "operator"}
                          </span>
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-8 w-8 ring-2 ring-primary/20 shrink-0">
                          <AvatarImage
                            src={profile?.avatar_url ?? undefined}
                            alt={profile?.full_name ?? "User"}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        {/* Online badge — hidden on xs */}
                        {profile?.status && (
                          <Badge
                            className={`hidden sm:inline-flex border-transparent text-[10px] px-1.5 py-0.5 ${
                              profile.status === "online"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-slate-500/10 text-slate-500"
                            }`}
                          >
                            {profile.status === "online" ? "Online" : "Away"}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </header>

                <main className="flex-1 overflow-auto bg-background p-4 md:p-6">
                  {children}
                </main>
              </div>
            </SidebarProvider>
          )}
        </ThemeProvider>

        {/* Global utility: hide scrollbar while keeping scroll functionality */}
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </body>
    </html>
  );
}

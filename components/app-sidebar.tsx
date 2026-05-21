"use client"

import * as React from "react"
import { Home, ScanSearch, BarChart3, Database, User, LogOut, BrainCircuit } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { signOut } from "@/app/actions/auth"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from "@/components/ui/sidebar"

// IMPORT COMPONENT ALERT DIALOG
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const data = {
    navMain: [
        {
            title: "Home",
            url: "/",
            icon: Home,
        },
        {
            title: "Detection Result",
            url: "/detection-result",
            icon: ScanSearch,
        },
        {
            title: "Statistic",
            url: "/statistic",
            icon: BarChart3,
        },
        {
            title: "Database",
            url: "/database",
            icon: Database,
        },
        {
            title: "User",
            url: "/user",
            icon: User,
        },
        {
            title: "Train Model",
            url: "/train-model",
            icon: BrainCircuit,
        }
    ],
}

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    const handleLogout = async () => {
        await signOut()
    }

    return (
        <Sidebar className={cn("font-gelasio", className)} {...props}>
            {/* HEADER LOGO */}
            <SidebarHeader className="h-16 flex items-center justify-center border-b border-sidebar-border px-4 py-2">
                <Link href="/" className="flex items-center gap-2 max-w-full">
                    <Image src="/logo.webp" alt="Logo" width={140} height={50} className="object-contain" priority />
                </Link>
            </SidebarHeader>

            {/* CONTENT MENU */}
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-2">
                            {data.navMain.map((item) => {
                                const isActive = pathname === item.url || (item.url !== "/" && pathname?.startsWith(item.url))
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                            className={cn(
                                                "h-12 text-base",
                                                isActive ? "bg-primary/40 text-primary font-bold dark:bg-primary/40 hover:bg-primary/40" : ""
                                            )}
                                        >
                                            <Link href={item.url} className="flex gap-3 w-full">
                                                <item.icon className="size-10" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* FOOTER LOGOUT DENGAN KONFIRMASI POP-UP */}
            <SidebarFooter className="border-t border-sidebar-border p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <AlertDialog>
                            {/* Trigger: Menggunakan tombol asli kamu */}
                            <AlertDialogTrigger asChild>
                                <SidebarMenuButton
                                    className="h-12 text-base text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-3 cursor-pointer"
                                >
                                    <LogOut className="size-10" />
                                    <span className="font-medium">Logout</span>
                                </SidebarMenuButton>
                            </AlertDialogTrigger>

                            {/* Konten Pop-up */}
                            <AlertDialogContent className="font-gelasio">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Apakah Anda yakin ingin keluar dari aplikasi? Anda harus login kembali untuk mengakses data.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleLogout}
                                        className="bg-red-500 hover:bg-red-600 text-white"
                                    >
                                        Keluar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}

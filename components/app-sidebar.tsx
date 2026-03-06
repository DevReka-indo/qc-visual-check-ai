"use client"

import * as React from "react"
import { Home, ScanSearch, BarChart3, Database, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

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
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    return (
        <Sidebar {...props}>
            <SidebarHeader className="h-16 flex items-center justify-center border-b border-sidebar-border px-4 py-2">
                <Link href="/" className="flex items-center gap-2 max-w-full">
                    <Image src="/logo.webp" alt="Logo" width={140} height={50} className="object-contain" priority />
                </Link>
            </SidebarHeader>
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
        </Sidebar>
    )
}

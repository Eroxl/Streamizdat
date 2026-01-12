"use client";

import { CircleUser, Shield, Users, Video } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import usePermissions, { hasPermission } from "@/lib/hooks/usePermissions";

const navigationItems = [
    {
        name: "Account",
        href: "/settings/account",
        icon: CircleUser,
    },
    {
        name: "Stream",
        href: "/settings/stream",
        requiredPermission: "manage_stream",
        icon: Video,
    },
    {
        name: "Community",
        href: "/settings/community",
        requiredPermission: "manage_embeds",
        icon: Users,
    },
    {
        name: "Moderation",
        href: "/settings/moderation",
        requiredPermission: "manage_admin_users",
        icon: Shield,
    }
];

export default function SettingsSidebar() {
    const pathName = usePathname();
    const { data: userPermissions } = usePermissions();

    return (
        <aside
            className={`w-64 bg-nord0 shrink-0 border-l border-nord2 border-r h-screen p-6 relative`}
        >
            <nav className="gap-2 h-full flex flex-col">
                {navigationItems
                    .filter((item) => {
                        if (!item.requiredPermission) return true;
                        return hasPermission(userPermissions, item.requiredPermission);
                    })
                    .map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center py-2 rounded hover:bg-nord1 px-2 ${pathName.startsWith(item.href) ? "bg-nord2" : ""}`}
                        >
                            <div className="w-6 h-6 flex justify-center items-center shrink-0">
                                <item.icon className="h-5 w-5" />
                            </div>
                            <span className="whitespace-nowrap ml-3">{item.name}</span>
                        </Link>
                    ))}
            </nav>
        </aside>
    );
}
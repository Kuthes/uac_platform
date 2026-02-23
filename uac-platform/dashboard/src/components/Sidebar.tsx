"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Network, Shield, Settings, LogOut } from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();

    const navigation = [
        { name: "Dashboard", href: "/dashboard", icon: Activity },
        { name: "Network", href: "/network", icon: Network },
        { name: "Security", href: "/security", icon: Shield },
        { name: "Settings", href: "/settings", icon: Settings },
    ];

    return (
        <div className="flex flex-col w-64 bg-gray-900 border-r border-gray-800 h-screen sticky top-0">
            <div className="flex items-center justify-center h-16 bg-gray-900 border-b border-gray-800">
                <span className="text-white text-xl font-bold tracking-wider">UAC<span className="text-blue-500">Platform</span></span>
            </div>
            <div className="flex-1 overflow-y-auto w-full mt-4">
                <nav className="flex-1 px-4 space-y-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                    }`}
                            >
                                <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="p-4 border-t border-gray-800">
                <Link
                    href="/login"
                    className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                    Logout
                </Link>
            </div>
        </div>
    );
}

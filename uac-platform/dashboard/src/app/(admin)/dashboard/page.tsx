"use client";

import { Activity, Users, Shield, Globe } from "lucide-react";

export default function Dashboard() {
    const stats = [
        { name: 'Active Users', value: '1,234', icon: Users, color: 'text-blue-500' },
        { name: 'Online APs', value: '42', icon: Globe, color: 'text-green-500' },
        { name: 'Blocked Threats', value: '89', icon: Shield, color: 'text-red-500' },
        { name: 'Bandwidth Usage', value: '450 Mbps', icon: Activity, color: 'text-purple-500' },
    ];

    return (
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-4 sm:px-0">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Dashboard Overview</h1>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((item) => (
                        <div key={item.name} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{item.name}</dt>
                                            <dd>
                                                <div className="text-lg font-medium text-gray-900 dark:text-white">{item.value}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8">
                    <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h2>
                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {[1, 2, 3].map((i) => (
                                <li key={i}>
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-blue-600 truncate">User login: testuser_{i}</p>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Success
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    VLAN 10
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                                                <p>Just now</p>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
}

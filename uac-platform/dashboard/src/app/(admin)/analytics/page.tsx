"use client";

import React, { useEffect, useState } from 'react';
import { Activity, Users, Download, Upload } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string;
    subValue?: string;
    icon: React.ReactNode;
}

const MetricCard = ({ title, value, subValue, icon }: MetricCardProps) => (
    <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm font-medium">{title}</div>
            <div className="text-gray-500">{icon}</div>
        </div>
        <div className="mt-4 flex items-baseline">
            <div className="text-3xl font-semibold text-white">{value}</div>
            {subValue && <div className="ml-2 text-sm text-gray-400">{subValue}</div>}
        </div>
    </div>
);

export default function AnalyticsPage() {
    const [data, setData] = useState({
        active_users: 0,
        total_bandwidth_mb: 0,
        recent_sessions: [] as any[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:8000/analytics/summary')
            .then(res => res.json())
            .then(json => {
                setData(json);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load analytics", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="p-8 text-white">Loading analytics...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Analytics Overview</h1>
                    <p className="text-gray-400 mt-1">Real-time network usage and session visibility.</p>
                </div>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-sm font-semibold text-white transition-colors">
                    Refresh Data
                </button>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Active Sessions"
                    value={data.active_users.toString()}
                    icon={<Users size={20} />}
                />
                <MetricCard
                    title="Total Bandwidth"
                    value={data.total_bandwidth_mb.toString()}
                    subValue="MB"
                    icon={<Activity size={20} />}
                />
                <MetricCard
                    title="Average Session"
                    value="45"
                    subValue="mins"
                    icon={<Activity size={20} />}
                />
            </div>

            {/* Recent Sessions Table */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700">
                    <h3 className="text-lg font-medium text-white">Recent Sessions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">MAC Address</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IP Address</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Traffic (Down/Up)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {data.recent_sessions.map((session, idx) => (
                                <tr key={idx} className="hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{session.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{session.mac}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{session.ip}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{Math.round(session.duration_sec / 60)} mins</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        <div className="flex items-center space-x-2">
                                            <span className="flex items-center text-green-400"><Download size={14} className="mr-1" />{session.download_mb} MB</span>
                                            <span className="flex items-center text-blue-400"><Upload size={14} className="mr-1" />{session.upload_mb} MB</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.recent_sessions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No recent sessions logged.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

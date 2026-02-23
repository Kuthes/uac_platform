"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Settings, Activity, Server, AlertTriangle } from 'lucide-react';

interface IdsConfig {
    enabled: boolean;
    engine: "suricata" | "snort";
    mode: "detection" | "prevention";
    interfaces: string[];
}

interface Alert {
    timestamp: string;
    source_ip: string;
    dest_ip: string;
    signature: string;
    severity: number;
    category: string;
    engine: string;
}

export default function IdsDashboardPage() {
    const [config, setConfig] = useState<IdsConfig>({
        enabled: false,
        engine: "suricata",
        mode: "detection",
        interfaces: ["eth0"]
    });
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [loadingAlerts, setLoadingAlerts] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
        fetchAlerts();

        // Auto-refresh alerts every 10 seconds
        const interval = setInterval(() => {
            fetchAlerts();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchConfig = async () => {
        try {
            setLoadingConfig(true);
            const res = await fetch('http://localhost:8000/system/ids/config');
            if (res.ok) setConfig(await res.json());
        } catch (err) {
            console.error("Failed to load IDS config", err);
        } finally {
            setLoadingConfig(false);
        }
    };

    const fetchAlerts = async () => {
        try {
            const res = await fetch('http://localhost:8000/system/ids/alerts');
            if (res.ok) setAlerts(await res.json());
        } catch (err) {
            console.error("Failed to fetch alerts", err);
        } finally {
            setLoadingAlerts(false);
        }
    };

    const saveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('http://localhost:8000/system/ids/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                setConfig(await res.json());
                // Force an immediate re-fetch of alerts so mock logs swap
                fetchAlerts();
            }
        } catch (err) {
            console.error("Failed to save config", err);
        } finally {
            setIsSaving(false);
        }
    };

    const getSeverityColor = (severity: number) => {
        if (severity === 1) return "text-red-400 bg-red-900/40 border-red-800";
        if (severity === 2) return "text-orange-400 bg-orange-900/40 border-orange-800";
        return "text-yellow-400 bg-yellow-900/40 border-yellow-800";
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center">
                        <ShieldAlert className="mr-3 text-red-500" /> Advanced Threat Prevention
                    </h1>
                    <p className="text-gray-400 mt-1">Dual-Engine Network Intrusion Detection System (IDS/IPS).</p>
                </div>
            </div>

            {/* Configuration Form */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700 bg-gray-900/50 flex items-center">
                    <Settings size={18} className="text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-white">Engine Configuration</h3>
                </div>

                {loadingConfig ? (
                    <div className="p-6 text-gray-400">Loading Configuration...</div>
                ) : (
                    <form onSubmit={saveConfig} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Master Toggle */}
                            <div className="flex flex-col justify-center">
                                <label className="flex items-center cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={config.enabled}
                                            onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                                        />
                                        <div className={`block w-14 h-8 rounded-full transition-colors ${config.enabled ? 'bg-indigo-600' : 'bg-gray-600'}`}></div>
                                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${config.enabled ? 'transform translate-x-6' : ''}`}></div>
                                    </div>
                                    <div className="ml-3 font-medium text-white">
                                        Master Switch: {config.enabled ? <span className="text-green-400">Online</span> : <span className="text-gray-500">Offline</span>}
                                    </div>
                                </label>
                            </div>

                            {/* Engine Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Security Engine Overview</label>
                                <select
                                    disabled={!config.enabled}
                                    value={config.engine}
                                    onChange={e => setConfig({ ...config, engine: e.target.value as "suricata" | "snort" })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 transition-opacity disabled:opacity-50"
                                >
                                    <option value="suricata">Suricata (High-Performance Multi-threaded)</option>
                                    <option value="snort">Snort 3 (Legacy Industry Standard)</option>
                                </select>
                            </div>

                            {/* Action Mode */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Action Mode</label>
                                <select
                                    disabled={!config.enabled}
                                    value={config.mode}
                                    onChange={e => setConfig({ ...config, mode: e.target.value as "detection" | "prevention" })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 transition-opacity disabled:opacity-50"
                                >
                                    <option value="detection">IDS: Detection Only (Alerts merely logged)</option>
                                    <option value="prevention">IPS: Active Prevention (Malicious packets dropped)</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
                            >
                                {isSaving ? "Applying..." : "Apply & Restart Engine"}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Threat Events Table */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-sm overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
                    <div className="flex items-center">
                        <Activity size={18} className="text-gray-400 mr-2" />
                        <h3 className="text-lg font-medium text-white">Live Security Events</h3>
                    </div>
                    {config.enabled && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900 text-green-200">
                            <span className="w-2 h-2 mr-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            Monitoring ({config.engine.toUpperCase()})
                        </span>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-900/80">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Severity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Source IP</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Destination IP</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Detection Signature</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {loadingAlerts ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading events...</td></tr>
                            ) : alerts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        {config.enabled ? "Secure. No malicious events detected recently." : "Engine offline. Enable the Master Switch to begin packet inspection."}
                                    </td>
                                </tr>
                            ) : alerts.map((alert, idx) => (
                                <tr key={idx} className="hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                                        {new Date(alert.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                                            <AlertTriangle size={12} className="mr-1" /> Sev {alert.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{alert.source_ip}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{alert.dest_ip}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-400">{alert.signature}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{alert.category}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}

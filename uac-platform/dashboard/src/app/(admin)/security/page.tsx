"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Shield, Lock, Unlock, RefreshCw } from "lucide-react";

interface AppProtocol {
    id: string;
    name: string;
    category: string;
}

interface FirewallRule {
    app_id: string;
    action: "ACCEPT" | "DROP" | "REJECT";
    enabled: boolean;
}

interface Policy {
    rules: FirewallRule[];
}

export default function SecurityPage() {
    const [apps, setApps] = useState<AppProtocol[]>([]);
    const [policy, setPolicy] = useState<Policy>({ rules: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [appsRes, policyRes] = await Promise.all([
                axios.get("http://localhost:8000/system/security/apps"),
                axios.get("http://localhost:8000/system/security/policy")
            ]);
            setApps(appsRes.data);
            setPolicy(policyRes.data);
        } catch (err) {
            console.error("Failed to fetch security data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleApp = (appId: string, currentStatus: boolean) => {
        // Logic: If currently blocked (enabled=true, action=DROP), we want to Allow (enabled=false)
        // If currently allowed (not in rules or enabled=false), we want to Block (enabled=true, action=DROP)

        const existingRuleIndex = policy.rules.findIndex(r => r.app_id === appId);
        const newRules = [...policy.rules];

        if (existingRuleIndex >= 0) {
            // Toggle existing rule
            newRules[existingRuleIndex] = {
                ...newRules[existingRuleIndex],
                enabled: !newRules[existingRuleIndex].enabled,
                action: "DROP"
            };
        } else {
            // Create new rule
            newRules.push({
                app_id: appId,
                action: "DROP",
                enabled: true
            });
        }

        setPolicy({ rules: newRules });
    };

    const savePolicy = async () => {
        try {
            setSaving(true);
            await axios.post("http://localhost:8000/system/security/policy", policy);
            alert("Policy applied successfully!");
        } catch (err) {
            alert("Failed to apply policy");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const isBlocked = (appId: string): boolean => {
        const rule = policy.rules.find(r => r.app_id === appId);
        return rule?.enabled === true && rule.action === "DROP";
    };

    // Group apps by category
    const categories = Array.from(new Set(apps.map(a => a.category)));

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Shield className="h-8 w-8 text-red-500" />
                            Application Control
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage Layer-7 Deep Packet Inspection (DPI) Policies.</p>
                    </div>
                    <button
                        onClick={savePolicy}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5" />}
                        Apply Policy
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">Loading Application Database...</div>
                ) : (
                    <div className="space-y-8">
                        {categories.map(category => (
                            <div key={category} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{category}</h3>
                                </div>
                                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {apps.filter(a => a.category === category).map(app => (
                                        <div
                                            key={app.id}
                                            className={`flex items-center justify-between p-4 rounded-lg border ${isBlocked(app.id) ? 'border-red-200 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                                        >
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{app.name}</div>
                                                <div className="text-xs text-gray-500">{app.id}</div>
                                            </div>
                                            <button
                                                onClick={() => toggleApp(app.id, isBlocked(app.id))}
                                                className={`p-2 rounded-full transition-colors ${isBlocked(app.id) ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                                            >
                                                {isBlocked(app.id) ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

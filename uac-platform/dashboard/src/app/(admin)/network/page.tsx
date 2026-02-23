"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Network, Plus, Server, Activity } from "lucide-react";

interface InterfaceConfig {
    name: string;
    type: string;
    status: string;
    ip: string;
    vlan_id?: number;
    parent?: string;
}

export default function NetworkPage() {
    const [interfaces, setInterfaces] = useState<InterfaceConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [showVlanModal, setShowVlanModal] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [selectedInterface, setSelectedInterface] = useState<InterfaceConfig | null>(null);

    // Form State (VLAN)
    const [parentId, setParentId] = useState("eth1");
    const [vlanId, setVlanId] = useState("");
    const [ipCidr, setIpCidr] = useState("");

    // Form State (Config)
    const [configDhcp, setConfigDhcp] = useState(false);
    const [configIp, setConfigIp] = useState("");
    const [configGw, setConfigGw] = useState("");

    const fetchInterfaces = async () => {
        try {
            const res = await axios.get("http://localhost:8000/system/network/interfaces");
            setInterfaces(res.data);
        } catch (err) {
            console.error("Failed to fetch interfaces", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterfaces();
    }, []);

    const handleCreateVlan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:8000/system/network/vlan", {
                vlan_id: parseInt(vlanId),
                parent_interface: parentId,
                ip_cidr: ipCidr,
                dhcp_server_enabled: true
            });
            setShowVlanModal(false);
            fetchInterfaces();
            alert("VLAN Created Successfully!");
        } catch (err) {
            alert("Failed to create VLAN");
            console.error(err);
        }
    };

    const handleConfigureInterface = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInterface) return;

        try {
            await axios.post("http://localhost:8000/system/network/interface", {
                name: selectedInterface.name,
                dhcp4: configDhcp,
                addresses: configDhcp ? null : (configIp ? [configIp] : null),
                gateway4: configDhcp ? null : (configGw ? configGw : null),
                nameservers: configDhcp ? null : ["8.8.8.8", "1.1.1.1"]
            });
            setShowConfigModal(false);
            fetchInterfaces();
            alert("Interface Configured Successfully!");
        } catch (err) {
            alert("Failed to configure Interface");
            console.error(err);
        }
    };

    const openConfigModal = (iface: InterfaceConfig) => {
        setSelectedInterface(iface);
        setConfigDhcp(false);
        setConfigIp(iface.ip !== "Unconfigured" ? iface.ip : "");
        setConfigGw("");
        setShowConfigModal(true);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Network className="h-8 w-8 text-blue-500" />
                            Network Orchestration
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage Interfaces, VLANs, and DHCP scopes.</p>
                    </div>
                    <button
                        onClick={() => setShowVlanModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        <Plus className="h-5 w-5" />
                        Add VLAN
                    </button>
                </div>

                {/* Interface Table */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Interface</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">IP Address</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">VLAN ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
                            ) : interfaces.map((iface) => (
                                <tr key={iface.name}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Server className="h-5 w-5 text-gray-400 mr-2" />
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{iface.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${iface.type === 'physical' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                                            {iface.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{iface.ip || 'Unconfigured'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="flex items-center text-sm text-gray-500 dark:text-gray-300">
                                            <Activity className="h-4 w-4 text-green-500 mr-1" />
                                            {iface.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {iface.vlan_id || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {iface.type === 'physical' && (
                                            <button
                                                onClick={() => openConfigModal(iface)}
                                                className="text-blue-600 hover:text-blue-900 border border-blue-600 hover:bg-blue-50 px-3 py-1 rounded"
                                            >
                                                Configure
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create VLAN Modal */}
            {showVlanModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Create New VLAN</h2>
                        <form onSubmit={handleCreateVlan} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Parent Interface</label>
                                <select
                                    value={parentId}
                                    onChange={(e) => setParentId(e.target.value)}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="eth0">eth0</option>
                                    <option value="eth1">eth1</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">VLAN ID (1-4094)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="4094"
                                    value={vlanId}
                                    onChange={(e) => setVlanId(e.target.value)}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="e.g. 10"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">IP Address (CIDR)</label>
                                <input
                                    type="text"
                                    value={ipCidr}
                                    onChange={(e) => setIpCidr(e.target.value)}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="e.g. 192.168.10.1/24"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowVlanModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Create VLAN
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Configure Interface Modal */}
            {showConfigModal && selectedInterface && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Configure {selectedInterface.name}</h2>
                        <form onSubmit={handleConfigureInterface} className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    id="dhcpClient"
                                    checked={configDhcp}
                                    onChange={(e) => setConfigDhcp(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="dhcpClient" className="text-sm font-medium dark:text-gray-300">
                                    Enable DHCP Client
                                </label>
                            </div>

                            {!configDhcp && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Static IP (CIDR)</label>
                                        <input
                                            type="text"
                                            value={configIp}
                                            onChange={(e) => setConfigIp(e.target.value)}
                                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="e.g. 192.168.1.100/24"
                                            required={!configDhcp}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Gateway</label>
                                        <input
                                            type="text"
                                            value={configGw}
                                            onChange={(e) => setConfigGw(e.target.value)}
                                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="e.g. 192.168.1.1"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowConfigModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Save Config
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

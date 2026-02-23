"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Globe, Server, Activity } from 'lucide-react';

interface VpnPeer {
    name: string;
    mode: "L2" | "L3";
    endpoint: string;
    public_key: string;
    allowed_ips?: string;
    target_vlan?: string;
    is_active: boolean;
}

export default function VpnDashboardPage() {
    const [peers, setPeers] = useState<VpnPeer[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState<Partial<VpnPeer>>({
        name: '',
        mode: 'L3',
        endpoint: '',
        public_key: '',
        allowed_ips: '',
        target_vlan: '',
        is_active: true
    });

    const fetchPeers = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:8000/system/vpn/peers');
            if (res.ok) {
                setPeers(await res.json());
            }
        } catch (err) {
            console.error("Failed to fetch VPN peers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPeers();
    }, []);

    const handleAddPeer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:8000/system/vpn/peers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchPeers();
                // reset form
                setFormData({ name: '', mode: 'L3', endpoint: '', public_key: '', allowed_ips: '', target_vlan: '', is_active: true });
            } else {
                alert("Failed to add peer. Name might already exist.");
            }
        } catch (err) {
            console.error("Error creating peer", err);
        }
    };

    const handleDelete = async (name: string) => {
        if (confirm(`Are you sure you want to delete the SD-WAN Site: ${name}?`)) {
            try {
                await fetch(`http://localhost:8000/system/vpn/peers/${name}`, { method: 'DELETE' });
                fetchPeers();
            } catch (err) {
                console.error("Failed to delete", err);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">SD-WAN Sites</h1>
                    <p className="text-gray-400 mt-1">Manage remote VPN Peers and Corporate Branches.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-sm font-semibold text-white transition-colors"
                >
                    <Plus size={16} className="mr-2" />
                    Add Remote Site
                </button>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Site Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Endpoint</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Routing Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {loading ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading instances...</td></tr>
                        ) : peers.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No Remote Sites Configured.</td></tr>
                        ) : peers.map((p, idx) => (
                            <tr key={idx} className="hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="font-medium text-white block">{p.name}</span>
                                    <span className="text-xs text-gray-500 font-mono" title="Public Key / Cert snippet">
                                        ...{p.public_key.substring(0, 12)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {p.mode === 'L2' ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900 text-purple-200"><Server size={12} className="mr-1" /> L2 Bridged</span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-200"><Globe size={12} className="mr-1" /> L3 Routed</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{p.endpoint}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {p.mode === 'L2' ? `Bridge to: ${p.target_vlan}` : `Subnets: ${p.allowed_ips}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {p.is_active ? (
                                        <span className="inline-flex items-center text-green-400"><Activity size={14} className="mr-1" /> Active</span>
                                    ) : (
                                        <span className="text-gray-500">Disabled</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <button onClick={() => handleDelete(p.name)} className="text-red-400 hover:text-red-300 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-white">Add Remote SD-WAN Site</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleAddPeer} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Site / Peer Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. BranchOfficeA" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Tunnel Type</label>
                                    <select required value={formData.mode} onChange={e => setFormData({ ...formData, mode: e.target.value as "L2" | "L3" })} className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500">
                                        <option value="L3">Layer 3 Routed (WireGuard)</option>
                                        <option value="L2">Layer 2 Bridged (SoftEther/TAP)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Remote Endpoint IP:Port</label>
                                    <input type="text" required value={formData.endpoint} onChange={e => setFormData({ ...formData, endpoint: e.target.value })} className="w-full font-mono bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. 203.0.113.1:51820" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Public Key / Target Cert</label>
                                    <input type="text" required value={formData.public_key} onChange={e => setFormData({ ...formData, public_key: e.target.value })} className="w-full font-mono bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500" placeholder="Base64 ID string" />
                                </div>
                            </div>

                            {formData.mode === 'L3' ? (
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Allowed IPs (Remote Subnets to Route)</label>
                                    <input type="text" required value={formData.allowed_ips || ''} onChange={e => setFormData({ ...formData, allowed_ips: e.target.value })} className="w-full font-mono bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. 10.20.0.0/24, 10.21.0.0/24" />
                                    <p className="mt-1 text-xs text-gray-500">Only data originating from these subnets will be accepted over the tunnel.</p>
                                </div>
                            ) : (
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Target Local VLAN Context to Bridge</label>
                                    <input type="text" required value={formData.target_vlan || ''} onChange={e => setFormData({ ...formData, target_vlan: e.target.value })} className="w-full font-mono bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. eth1.10" />
                                    <p className="mt-1 text-xs text-gray-500">The external remote Ethernet frames will be natively injected into this local broadcast domain.</p>
                                </div>
                            )}

                            <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-700 flex justify-end space-x-3 -mx-6 -mb-6 mt-6 rounded-b-lg">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium text-white transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-sm font-medium text-white transition-colors">Save Remote Site</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

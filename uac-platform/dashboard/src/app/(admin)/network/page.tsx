"use client";

import React, { useState, useEffect } from 'react';
import { Network, Server, Settings, Plus, Activity, Layers, Link as LinkIcon, Link2Off } from 'lucide-react';

interface PhysicalPort {
    name: string;
    mac_address: string;
    operstate: string;
    speed: number;
    assigned_profile_id: string | null;
}

interface NetworkProfile {
    id: string;
    name: string;
    vlan_id: number | null;
    ip_cidr: string | null;
    dhcp_server_enabled: boolean;
}

export default function NetworkOrchestrationPage() {
    const [ports, setPorts] = useState<PhysicalPort[]>([]);
    const [profiles, setProfiles] = useState<NetworkProfile[]>([]);
    const [loading, setLoading] = useState(true);

    // Profile Form State
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileForm, setProfileForm] = useState<Partial<NetworkProfile>>({
        id: '',
        name: '',
        vlan_id: null,
        ip_cidr: '',
        dhcp_server_enabled: true
    });

    // Port Mapping State
    const [isPortModalOpen, setIsPortModalOpen] = useState(false);
    const [selectedPort, setSelectedPort] = useState<PhysicalPort | null>(null);
    const [selectedProfileId, setSelectedProfileId] = useState<string>("none");

    useEffect(() => {
        fetchData();
        // Hardware auto-refresh
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [portsRes, profilesRes] = await Promise.all([
                fetch('http://localhost:8000/system/network/ports'),
                fetch('http://localhost:8000/system/network/profiles')
            ]);

            if (portsRes.ok) setPorts(await portsRes.json());
            if (profilesRes.ok) setProfiles(await profilesRes.json());
        } catch (err) {
            console.error("Failed to fetch network state", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...profileForm,
                id: profileForm.id || `prof_${Date.now()}` // generate simple id
            };
            const res = await fetch('http://localhost:8000/system/network/profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setIsProfileModalOpen(false);
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteProfile = async (id: string) => {
        if (confirm("Are you sure? Any ports mapped to this profile will lose connectivity.")) {
            try {
                await fetch(`http://localhost:8000/system/network/profiles/${id}`, { method: 'DELETE' });
                fetchData();
            } catch (err) { console.error(err); }
        }
    };

    const handleAssignProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPort) return;
        try {
            const res = await fetch(`http://localhost:8000/system/network/ports/${selectedPort.name}/assign/${selectedProfileId}`, {
                method: 'POST'
            });
            if (res.ok) {
                setIsPortModalOpen(false);
                fetchData();
            }
        } catch (err) { console.error(err); }
    };

    const getProfileDetails = (id: string | null) => {
        if (!id) return null;
        return profiles.find(p => p.id === id);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center">
                        <Server className="mr-3 text-indigo-500" /> Edge Gateway Orchestration
                    </h1>
                    <p className="text-gray-400 mt-1">Manage physical hardware mapping and standardized network profiles.</p>
                </div>
            </div>

            {/* Hardware Ports Section */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700 bg-gray-900/50 flex items-center justify-between">
                    <div className="flex items-center">
                        <Activity size={18} className="text-indigo-400 mr-2" />
                        <h3 className="text-lg font-medium text-white">Physical Hardware Ports</h3>
                    </div>
                </div>
                <div className="p-6">
                    {loading && ports.length === 0 ? (
                        <div className="text-gray-500">Scanning hardware...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {ports.map((port, idx) => {
                                const profile = getProfileDetails(port.assigned_profile_id);
                                const isUp = port.operstate === "up";
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => { setSelectedPort(port); setSelectedProfileId(port.assigned_profile_id || "none"); setIsPortModalOpen(true); }}
                                        className={`p-4 rounded-lg border cursor-pointer hover:border-indigo-500 transition-all ${isUp ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-800/80 border-gray-700 opacity-60'}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-lg font-bold text-white font-mono">{port.name}</h4>
                                                <p className="text-xs text-gray-400 font-mono mt-0.5">{port.mac_address}</p>
                                            </div>
                                            {isUp ? (
                                                <span className="p-1.5 bg-green-500/20 text-green-400 rounded-md" title="Link UP">
                                                    <LinkIcon size={16} />
                                                </span>
                                            ) : (
                                                <span className="p-1.5 bg-red-500/20 text-red-500 rounded-md" title="Link DOWN">
                                                    <Link2Off size={16} />
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-600/50">
                                            {profile ? (
                                                <div>
                                                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">MAPPED PROFILE</span>
                                                    <span className="inline-flex items-center text-sm text-white font-medium">
                                                        <Layers size={14} className="mr-1.5 text-gray-400" /> {profile.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">MAPPED PROFILE</span>
                                                    <span className="text-sm text-gray-500 italic">Unassigned (Dead Port)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Network Profiles Section */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-sm overflow-hidden mt-8">
                <div className="px-6 py-4 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
                    <div className="flex items-center">
                        <Layers size={18} className="text-purple-400 mr-2" />
                        <h3 className="text-lg font-medium text-white">Declarative Network Profiles</h3>
                    </div>
                    <button
                        onClick={() => {
                            setProfileForm({ id: '', name: '', vlan_id: null, ip_cidr: '', dhcp_server_enabled: true });
                            setIsProfileModalOpen(true);
                        }}
                        className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-sm font-semibold text-white transition-colors"
                    >
                        <Plus size={16} className="mr-2" />
                        New Profile
                    </button>
                </div>

                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Profile Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">VLAN Tag</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subnet Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Services</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {loading && profiles.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                        ) : profiles.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No Network Profiles found. Create one.</td></tr>
                        ) : profiles.map((p, idx) => (
                            <tr key={idx} className="hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{p.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                                    {p.vlan_id ? `VID ${p.vlan_id}` : "Native/Untagged"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                                    {p.ip_cidr || "No IP assigned"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {p.dhcp_server_enabled ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900 text-green-200">DHCP/Captive Portal</span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">Routing Only</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <button onClick={() => handleDeleteProfile(p.id)} className="text-red-400 hover:text-red-300 transition-colors text-xs font-medium">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Profile Creation Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-white">Create Network Profile</h3>
                            <button onClick={() => setIsProfileModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Profile Name</label>
                                <input type="text" required value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Corporate IoT VLAN" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">VLAN Tag (Optional)</label>
                                    <input type="number" min="1" max="4094" value={profileForm.vlan_id || ''} onChange={e => setProfileForm({ ...profileForm, vlan_id: e.target.value ? parseInt(e.target.value) : null })} className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. 50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Gateway IP CIDR</label>
                                    <input type="text" value={profileForm.ip_cidr || ''} onChange={e => setProfileForm({ ...profileForm, ip_cidr: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white font-mono focus:ring-indigo-500 focus:border-indigo-500" placeholder="10.50.0.1/24" />
                                </div>
                            </div>
                            <div className="pt-2">
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" checked={profileForm.dhcp_server_enabled} onChange={e => setProfileForm({ ...profileForm, dhcp_server_enabled: e.target.checked })} className="rounded bg-gray-900 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                    <span className="ml-2 text-sm text-gray-300">Enable DHCP & Captive Portal</span>
                                </label>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 bg-gray-700 text-white rounded-md">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save Profile</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Port Assignment Modal */}
            {isPortModalOpen && selectedPort && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                            <h3 className="text-lg font-medium text-white">Configure {selectedPort.name}</h3>
                            <button onClick={() => setIsPortModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleAssignProfile} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Assign Network Profile</label>
                                <select
                                    value={selectedProfileId}
                                    onChange={e => setSelectedProfileId(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500"
                                >
                                    <option value="none">-- Unassigned (Dead Port) --</option>
                                    {profiles.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} {p.vlan_id ? `(VLAN ${p.vlan_id})` : "(Native)"}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button type="submit" className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors">Apply Routing Config</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

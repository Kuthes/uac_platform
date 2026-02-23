"use client";

import React, { useState, useEffect } from 'react';
import { Palette, Link as LinkIcon, Edit, Settings } from 'lucide-react';

interface PortalSettings {
    brand_name: string;
    primary_color: string;
    welcome_text: string;
    terms_text: string;
    background_image_url: string;
    require_terms_acceptance: boolean;
}

export default function PortalCustomizationPage() {
    const [settings, setSettings] = useState<PortalSettings>({
        brand_name: "Universal Access",
        primary_color: "#4F46E5",
        welcome_text: "Welcome to our network. Please click agree to connect.",
        terms_text: "By connecting to this network, you agree to our Acceptable Use Policy.",
        background_image_url: "",
        require_terms_acceptance: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:8000/portal/settings');
            if (res.ok) {
                setSettings(await res.json());
            }
        } catch (err) {
            console.error("Failed to load portal settings", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('http://localhost:8000/portal/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                setSettings(await res.json());
            }
        } catch (err) {
            console.error("Failed to save settings", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center">
                        <Palette className="mr-3 text-pink-500" /> Portal Customization
                    </h1>
                    <p className="text-gray-400 mt-1">Design the appearance of the Guest Wi-Fi Captive Portal.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Settings Form */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-700 bg-gray-900/50 flex items-center">
                        <Settings size={18} className="text-gray-400 mr-2" />
                        <h3 className="text-lg font-medium text-white">Brand Properties</h3>
                    </div>
                    {loading ? (
                        <div className="p-6 text-gray-500">Loading Configuration...</div>
                    ) : (
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Brand / Location Name</label>
                                <input type="text" value={settings.brand_name} onChange={e => setSettings({ ...settings, brand_name: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Primary Color (Hex)</label>
                                <div className="flex space-x-3">
                                    <input type="color" value={settings.primary_color} onChange={e => setSettings({ ...settings, primary_color: e.target.value })} className="h-10 border-0 p-0 rounded-md bg-transparent cursor-pointer" />
                                    <input type="text" value={settings.primary_color} onChange={e => setSettings({ ...settings, primary_color: e.target.value })} className="flex-1 bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white font-mono focus:border-pink-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Welcome Text Header</label>
                                <input type="text" value={settings.welcome_text} onChange={e => setSettings({ ...settings, welcome_text: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:border-pink-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Terms of Service / AUP Text</label>
                                <textarea rows={3} value={settings.terms_text} onChange={e => setSettings({ ...settings, terms_text: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-sm text-gray-300 focus:border-pink-500"></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Background Image URL (Optional)</label>
                                <input type="text" placeholder="https://..." value={settings.background_image_url} onChange={e => setSettings({ ...settings, background_image_url: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-sm text-gray-300 font-mono focus:border-pink-500" />
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" checked={settings.require_terms_acceptance} onChange={e => setSettings({ ...settings, require_terms_acceptance: e.target.checked })} className="rounded bg-gray-900 border-gray-600 text-pink-600 focus:ring-pink-500" />
                                    <span className="ml-2 text-sm text-gray-300">Require Checkbox Acceptance before Login</span>
                                </label>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button type="submit" disabled={saving} className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center">
                                    {saving ? "Saving..." : <><Edit size={16} className="mr-2" /> Apply Branding</>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Live Preview Pane */}
                <div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-white">Live Preview</h3>
                            <a href="/portal" target="_blank" rel="noreferrer" className="text-xs text-pink-400 hover:text-pink-300 flex items-center">
                                Open Fullscreen <LinkIcon size={12} className="ml-1" />
                            </a>
                        </div>
                        {/* Simulated Mobile Mockup */}
                        <div className="flex-1 bg-gray-900 p-8 flex justify-center items-center">
                            <div className="w-[375px] h-[667px] bg-white rounded-[3rem] border-8 border-gray-800 overflow-hidden relative shadow-2xl flex flex-col justify-center items-center text-center p-8"
                                style={{
                                    backgroundImage: settings.background_image_url ? `url(${settings.background_image_url})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}>

                                {/* Dark overlay if image exists */}
                                {settings.background_image_url && <div className="absolute inset-0 bg-black/50 z-0"></div>}

                                <div className="relative z-10 w-full space-y-6">
                                    <h1 className={`text-2xl font-bold ${settings.background_image_url ? 'text-white' : 'text-gray-900'}`}>{settings.brand_name}</h1>
                                    <p className={`text-sm ${settings.background_image_url ? 'text-gray-200' : 'text-gray-600'}`}>{settings.welcome_text}</p>

                                    <div className="space-y-4 w-full">
                                        <input disabled type="text" placeholder="Access Voucher" className="w-full px-4 py-3 rounded-md border border-gray-300 bg-gray-50 focus:outline-none" />

                                        {settings.require_terms_acceptance && (
                                            <div className="flex items-start text-left text-xs bg-gray-100/80 p-3 rounded-md">
                                                <input disabled type="checkbox" className="mt-1 mr-2" />
                                                <span className="text-gray-600 flex-1">{settings.terms_text}</span>
                                            </div>
                                        )}

                                        <button disabled className="w-full py-3 rounded-md text-white font-medium transition-opacity" style={{ backgroundColor: settings.primary_color }}>
                                            Connect to Wi-Fi
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

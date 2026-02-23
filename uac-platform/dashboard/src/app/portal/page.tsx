"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Wifi, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PortalSettings {
    brand_name: string;
    primary_color: string;
    welcome_text: string;
    terms_text: string;
    background_image_url: string;
    require_terms_acceptance: boolean;
}

function PortalLoginContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'idle' | 'authenticating' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const res = searchParams.get('res');
    const challenge = searchParams.get('challenge');
    const uamip = searchParams.get('uamip') || '10.1.0.1';
    const uamport = searchParams.get('uamport') || '3990';
    const userurl = searchParams.get('userurl') || 'http://www.google.com';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [settings, setSettings] = useState<PortalSettings | null>(null);

    useEffect(() => {
        fetch('http://localhost:8000/portal/settings')
            .then(res => res.json())
            .then(data => setSettings(data))
            .catch(err => console.error("Could not load portal settings", err));

        if (res === 'notyet') {
            // Normal login prompt
        } else if (res === 'failed' || res === 'logoff') {
            setStatus('error');
            setErrorMessage('Authentication failed. Please check your credentials.');
        } else if (res === 'success' || res === 'already') {
            setStatus('success');
            setTimeout(() => {
                window.location.href = userurl;
            }, 3000);
        }
    }, [res, userurl]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (settings?.require_terms_acceptance && !acceptedTerms) {
            setStatus('error');
            setErrorMessage("You must accept the terms of service to connect.");
            return;
        }

        setStatus('authenticating');
        setErrorMessage('');

        const loginUrl = `http://${uamip}:${uamport}/logon`;

        try {
            // Proxy standard CoovaChilli UAM form submission
            const form = document.createElement('form');
            form.method = 'GET';
            form.action = loginUrl;

            const userField = document.createElement('input');
            userField.type = 'hidden';
            userField.name = 'username';
            userField.value = username;

            const passField = document.createElement('input');
            passField.type = 'hidden';
            passField.name = 'password';
            passField.value = password;

            form.appendChild(userField);
            form.appendChild(passField);

            document.body.appendChild(form);
            form.submit();

        } catch (err) {
            setStatus('error');
            setErrorMessage('An error occurred during network login.');
        }
    };

    if (!settings) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading Portal...</div>;
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700 p-8 text-center space-y-4">
                    <CheckCircle2 size={64} className="mx-auto text-green-500" />
                    <h2 className="text-2xl font-bold text-white">Connected!</h2>
                    <p className="text-gray-400">You now have internet access.</p>
                    <p className="text-sm text-gray-500">Redirecting to {userurl} ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center relative overflow-hidden"
            style={{
                backgroundImage: settings.background_image_url ? `url(${settings.background_image_url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}>

            {/* Background Dimmer */}
            {settings.background_image_url && <div className="absolute inset-0 bg-black/60 z-0"></div>}

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
                <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10">
                    <div className="mb-6 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: `${settings.primary_color}20` }}>
                            <Wifi className="h-8 w-8" style={{ color: settings.primary_color }} />
                        </div>
                        <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900">
                            {settings.brand_name}
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            {settings.welcome_text}
                        </p>
                    </div>

                    {status === 'error' && errorMessage && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{errorMessage}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="username" className="sr-only">Username</label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Username or Voucher Code"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {settings.require_terms_acceptance && (
                            <div className="flex items-start bg-gray-50 p-3 rounded-md border border-gray-200">
                                <div className="flex h-5 items-center">
                                    <input
                                        id="terms"
                                        name="terms"
                                        type="checkbox"
                                        checked={acceptedTerms}
                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300"
                                        style={{ accentColor: settings.primary_color }}
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="terms" className="font-medium text-gray-700">Accept Terms</label>
                                    <p className="text-gray-500 text-xs mt-1">{settings.terms_text}</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={status === 'authenticating'}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                                style={{ backgroundColor: settings.primary_color }}
                            >
                                {status === 'authenticating' ? 'Authenticating...' : 'Connect to Wi-Fi'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function PortalPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading UAC Portal...</div>}>
            <PortalLoginContent />
        </Suspense>
    );
}

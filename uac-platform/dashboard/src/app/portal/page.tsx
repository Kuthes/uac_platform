"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PortalLoginContent() {
    const searchParams = useSearchParams();
    const res = searchParams.get('res');
    const challenge = searchParams.get('challenge');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (res === 'notyet') {
            // Normal login prompt
        } else if (res === 'failed') {
            setError('Invalid username or password.');
        } else if (res === 'success') {
            // Typically the controller redirects immediately, but just in case:
            window.location.href = 'https://www.google.com';
        }
    }, [res]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // To process the UAM login, we actually need to submit to our *own* local controller backend first or directly to Chilli
        // Our backend will calculate the CHAP challenge response using the FreeRADIUS shared secret or we can just proxy cleartext to CoovaChilli 
        // CoovaChilli UAM standard: http://uamip:uamport/logon?username=x&password=y

        const uamip = searchParams.get('uamip') || '10.1.0.1';
        const uamport = searchParams.get('uamport') || '3990';
        const loginUrl = `http://${uamip}:${uamport}/logon`;

        try {
            // Create a form programmatically to submit the standard CoovaChilli UAM GET/POST
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
            setError('An error occurred during login. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
            <div className="text-center">
                <h2 className="mt-6 text-3xl font-extrabold text-white">
                    Universal Access
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                    Please log in to access the network
                </p>
            </div>

            {res === 'success' ? (
                <div className="text-center text-green-400 p-4 bg-green-900/20 rounded border border-green-800">
                    <p>You are connected!</p>
                    <a href="https://www.google.com" className="mt-4 inline-block underline hover:text-green-300">Continue to the internet</a>
                </div>
            ) : (
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded">
                            {error}
                        </div>
                    )}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="sr-only">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Authenticating...' : 'Connect to Wi-Fi'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default function PortalPage() {
    return (
        <Suspense fallback={<div className="text-white">Loading portal...</div>}>
            <PortalLoginContent />
        </Suspense>
    );
}

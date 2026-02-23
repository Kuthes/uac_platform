import React from 'react';

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center font-sans antialiased text-white">
            {children}
        </div>
    );
}

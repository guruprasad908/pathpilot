'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    return (
        <button
            onClick={handleLogout}
            className="text-sm px-4 py-2 border border-red-500/30 text-red-400 hover:text-white rounded-md hover:bg-red-600/30 transition-colors"
        >
            Sign Out
        </button>
    );
}

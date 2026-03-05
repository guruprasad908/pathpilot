import React from 'react';
import type { Metadata } from 'next';
import { getSession } from '../lib/auth';
import LandingClient from './LandingClient';

export const metadata: Metadata = {
    title: 'PathPilot — AI Learning Roadmaps',
};

export default async function LandingPage() {
    const session = await getSession();
    const isLoggedIn = !!session;

    return <LandingClient isLoggedIn={isLoggedIn} />;
}

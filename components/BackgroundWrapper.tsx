'use client';

import { usePathname } from 'next/navigation';
import BackgroundEffects from './BackgroundEffects';

export default function BackgroundWrapper() {
    const pathname = usePathname();

    // Disable background effects entirely on the universe and roadmap views
    // to keep the visual focus entirely on the pure black canvas and nodes.
    const isCleanView = pathname?.startsWith('/universe') || pathname?.startsWith('/roadmaps');

    if (isCleanView) {
        return null;
    }

    return <BackgroundEffects />;
}

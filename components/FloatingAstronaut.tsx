export default function FloatingAstronaut({
    delay,
    startX,
    startY,
    scale = 1,
    duration = 40,
}: {
    delay: number,
    startX: string,
    startY: string,
    scale?: number,
    duration?: number,
}) {
    return (
        <div
            className="absolute opacity-40 transition-opacity duration-1000 pointer-events-none select-none"
            style={{
                top: startY || '0%',
                left: startX || '0%',
                transform: `scale(${scale})`,
                animation: `transitAstronaut-${(startX || '0').toString().replace('%', '')} ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
                mixBlendMode: 'screen',
                zIndex: 1
            }}
        >
            <img
                src="/images/astronaut-cinematic.png"
                alt="Realistic astronaut drifting in space"
                className="w-48 h-auto select-none pointer-events-none"
                style={{
                    maskImage: 'radial-gradient(circle, black 40%, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 80%)',
                    filter: 'contrast(1.1) brightness(0.9)'
                }}
            />

            <style jsx>{`
                @keyframes transitAstronaut-${(startX || '0').replace('%', '')} {
                    0% { 
                        transform: translate(0, 0) rotate(0deg) scale(${scale}); 
                        opacity: 0;
                    }
                    5% { opacity: 0.4; }
                    /* Transit towards center (Space Base) */
                    85% { 
                        opacity: 0.4;
                        transform: translate(calc(50vw - ${startX || '0%'}), calc(50vh - ${startY || '0%'})) rotate(20deg) scale(${scale * 0.5});
                    }
                    /* Disappears at base */
                    90%, 100% { 
                        opacity: 0;
                        transform: translate(calc(50vw - ${startX || '0%'}), calc(50vh - ${startY || '0%'})) rotate(25deg) scale(${scale * 0.4});
                    }
                }
            `}</style>
        </div>
    );
}

'use client';

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import * as THREE from 'three';

const WORLD_RADIUS = 500;
const STAR_COUNT = 10000;

// --- UTILS ---
function hashString(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    return hash;
}

function mulberry32(a: number) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function getFibonacciSpherePoints(samples: number, radius: number): [number, number, number][] {
    const points: [number, number, number][] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
    for (let i = 0; i < samples; i++) {
        const y = 1 - (i / (samples - 1)) * 2; // y goes from 1 to -1
        const r = Math.sqrt(1 - y * y) * radius; // radius at y
        const theta = phi * i;
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        points.push([x, y * radius, z]);
    }
    return points;
}

// --- ADAPTER ---
export interface PlanetNode {
    id: string;
    title: string;
    radius: number;
    angle: number;
    speed: number;
    size: number;
    subtopics: any[];
    status: 'not_started' | 'in_progress' | 'completed';
    isChallenging: boolean;
}

export interface GalaxyNode {
    id: string;
    title: string;
    position: [number, number, number];
    scale: number;
    hueVariance: number;
    planets: PlanetNode[];
    completionPct: number;
    hasChallengingContent: boolean;
}

function transformRoadmapToGalaxies(roadmap: any, worldRadius: number): GalaxyNode[] {
    if (!roadmap || !roadmap.galaxies) return [];

    // Seed using roadmap ID for deterministic rendering
    const seed = hashString(roadmap.id || 'default');
    const random = mulberry32(seed);

    const numGalaxies = roadmap.galaxies.length;
    // Spread within WORLD_RADIUS * 0.6
    const radius = worldRadius * 0.6;

    if (numGalaxies === 1) {
        const g = roadmap.galaxies[0];
        const baseScale = 25;
        const planets: PlanetNode[] = [];
        const nPlanets = g.planets ? g.planets.length : 0;

        for (let j = 0; j < nPlanets; j++) {
            const p = g.planets[j];
            const pSeed = hashString(p.id || `planet-${j}`);
            const pRandom = mulberry32(pSeed);

            // Calculate Planet Status
            const subtopics = p.subtopics || [];
            let pStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';
            let isChallenging = false;

            if (subtopics.length > 0) {
                const allCompleted = subtopics.every((s: any) => s.status === 'completed');
                const anyStarted = subtopics.some((s: any) => s.status === 'in_progress' || s.status === 'completed');

                if (allCompleted) pStatus = 'completed';
                else if (anyStarted) pStatus = 'in_progress';

                // Check if any subtopic is a deep dive/challenging
                if (subtopics.some((s: any) => s.isDeepDive)) isChallenging = true;
            }

            // Also check planet-level deepDiveCount if available
            if (p.deepDiveCount > 0) isChallenging = true;

            planets.push({
                id: p.id || `planet-${j}`,
                title: p.title || 'Planet',
                radius: baseScale + 8 + (j * 4.5),
                angle: pRandom() * Math.PI * 2,
                speed: 0.1 + (pRandom() * 0.1),
                size: 0.8 + pRandom() * 1.5,
                subtopics: subtopics,
                status: pStatus,
                isChallenging: isChallenging
            });
        }

        // Galaxy Aggregates
        const totalSubtopics = planets.reduce((acc, p) => acc + (p.subtopics?.length || 0), 0);
        const completedSubtopics = planets.reduce((acc, p) => acc + (p.subtopics?.filter(s => s.status === 'completed').length || 0), 0);
        const completionPct = totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;
        const hasChallengingContent = planets.some(p => p.isChallenging);

        return [{
            id: g.id,
            title: g.title,
            position: [0, 0, 0],
            scale: baseScale,
            hueVariance: random(),
            planets: planets,
            completionPct,
            hasChallengingContent
        }];
    }

    const points = getFibonacciSpherePoints(numGalaxies, radius);

    return roadmap.galaxies.map((g: any, i: number) => {
        const point = points[i];

        // Jitter radius strictly so they don't look locked to a perfect shell, 
        // but within constraints 0.8 to 1.2
        const rJitter = 0.8 + random() * 0.4;
        const finalPos: [number, number, number] = [
            point[0] * rJitter,
            point[1] * rJitter,
            point[2] * rJitter
        ];

        const baseScale = 15 + random() * 15;

        const planets: PlanetNode[] = [];
        const numPlanets = g.planets ? g.planets.length : 0;

        for (let j = 0; j < numPlanets; j++) {
            const p = g.planets[j];
            const pSeed = hashString(p.id || `planet-${j}`);
            const pRandom = mulberry32(pSeed);

            // Calculate Planet Status
            const subtopics = p.subtopics || [];
            let pStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';
            let isChallenging = false;

            if (subtopics.length > 0) {
                const allCompleted = subtopics.every((s: any) => s.status === 'completed');
                const anyStarted = subtopics.some((s: any) => s.status === 'in_progress' || s.status === 'completed');

                if (allCompleted) pStatus = 'completed';
                else if (anyStarted) pStatus = 'in_progress';

                if (subtopics.some((s: any) => s.isDeepDive)) isChallenging = true;
            }
            if (p.deepDiveCount > 0) isChallenging = true;

            planets.push({
                id: p.id || `planet-${j}`,
                title: p.title || 'Planet',
                radius: baseScale + 8 + (j * 4.5), // galaxyCoreRadius + (index * spacing)
                angle: pRandom() * Math.PI * 2,
                speed: 0.1 + (pRandom() * 0.1),
                size: 0.8 + pRandom() * 1.5,
                subtopics: subtopics,
                status: pStatus,
                isChallenging: isChallenging
            });
        }

        // Galaxy Aggregates
        const totalSubtopics = planets.reduce((acc, p) => acc + (p.subtopics?.length || 0), 0);
        const completedSubtopics = planets.reduce((acc, p) => acc + (p.subtopics?.filter(s => s.status === 'completed').length || 0), 0);
        const completionPct = totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;
        const hasChallengingContent = planets.some(p => p.isChallenging);

        return {
            id: g.id,
            title: g.title,
            position: finalPos,
            scale: baseScale,
            hueVariance: random(),
            planets: planets,
            completionPct,
            hasChallengingContent
        };
    });
}

// --- COMPONENTS ---
function PlanetSphere({ node, isActive, onClick }: { node: PlanetNode, isActive: boolean, onClick: () => void }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const angleRef = useRef(node.angle);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        if (hovered) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'auto';
        }
    }, [hovered]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            if (!isActive) {
                // Only orbit if not focused
                angleRef.current += delta * node.speed * 0.5;
            }
            meshRef.current.position.x = Math.cos(angleRef.current) * node.radius;
            meshRef.current.position.z = Math.sin(angleRef.current) * node.radius;
            meshRef.current.rotation.y += delta * 0.5;

            // Pulse effect for in_progress
            if (materialRef.current && node.status === 'in_progress') {
                const t = state.clock.elapsedTime;
                const pulse = (Math.sin(t * 3) + 1) * 0.5; // 0 to 1
                materialRef.current.emissiveIntensity = 0.5 + pulse * 1.0;
            }
        }
    });

    // Material Props based on Status
    const color = useMemo(() => {
        if (node.status === 'completed') return '#2ecc71'; // Emerald
        if (node.status === 'in_progress') return '#00ffff'; // Cyan
        return '#8a9ba8'; // Muted Matte
    }, [node.status]);

    const emissive = useMemo(() => {
        if (node.status === 'completed') return '#2ecc71';
        if (node.status === 'in_progress') return '#00ffff';
        return '#000000';
    }, [node.status]);

    const emissiveInt = useMemo(() => {
        if (node.status === 'completed') return 0.4;
        if (node.status === 'in_progress') return 0.5; // Base, pulsed in loop
        return 0;
    }, [node.status]);

    return (
        <mesh
            ref={meshRef}
            name={`planet-${node.id}`}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
        >
            <sphereGeometry args={[node.size * 1.5, 16, 16]} />
            <meshBasicMaterial visible={false} />
            <mesh>
                <sphereGeometry args={[node.size, 16, 16]} />
                <meshStandardMaterial
                    ref={materialRef}
                    color={color}
                    roughness={node.status === 'not_started' ? 0.9 : 0.4}
                    metalness={node.status === 'not_started' ? 0.1 : 0.6}
                    emissive={emissive}
                    emissiveIntensity={emissiveInt}
                />
            </mesh>
        </mesh>
    );
}

function GalaxyNodeSpiral({
    node,
    isActive,
    onClick,
    activePlanet,
    onPlanetClick
}: {
    node: GalaxyNode,
    isActive: boolean,
    onClick: () => void,
    activePlanet: PlanetNode | null,
    onPlanetClick: (p: PlanetNode) => void
}) {
    const meshRef = useRef<THREE.Points>(null);
    const geometryRef = useRef<THREE.BufferGeometry>(null);
    const materialRef = useRef<THREE.PointsMaterial>(null);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        document.body.style.cursor = hovered ? 'pointer' : 'auto';
        return () => { document.body.style.cursor = 'auto'; };
    }, [hovered]);

    const PARTICLE_COUNT = 1500;

    const { positions, colors, initialRotation } = useMemo(() => {
        const pos = new Float32Array(PARTICLE_COUNT * 3);
        const col = new Float32Array(PARTICLE_COUNT * 3);

        const baseColor = new THREE.Color();
        // If galaxy is highly complete, boost brightness/saturation
        const completenessBoost = node.completionPct >= 80 ? 0.2 : 0;
        baseColor.setHSL(0.55 + node.hueVariance * 0.1, 0.8, 0.5 + completenessBoost);

        const arms = 3;
        const b = 0.28; // logarithmic spiral spread factor

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // Distance skewed heavily toward center
            const distRatio = Math.pow(Math.random(), 1.5);
            const radius = distRatio * node.scale;

            const armOffset = (i % arms) * ((Math.PI * 2) / arms);
            const theta = (1 / b) * Math.log(radius + 1) + armOffset;

            // Random jitter that increases with distance
            const randomSpread = (1 - distRatio) * (node.scale * 0.05) + distRatio * (node.scale * 0.2);
            const randomX = (Math.random() - 0.5) * randomSpread;
            const randomZ = (Math.random() - 0.5) * randomSpread;

            // Y-axis bulge for centralized volume
            const ySpread = Math.exp(-distRatio * 3) * (node.scale * 0.2) + (node.scale * 0.05);
            const randomY = (Math.random() - 0.5) * ySpread;

            pos[i * 3] = Math.cos(theta) * radius + randomX;
            pos[i * 3 + 1] = randomY;
            pos[i * 3 + 2] = Math.sin(theta) * radius + randomZ;

            const dotColor = baseColor.clone();
            // Core becomes bright, outer edges darken and fade
            dotColor.lerp(new THREE.Color(0xffffff), Math.max(0, 0.8 - distRatio * 2));
            dotColor.offsetHSL(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                -distRatio * 0.4
            );

            col[i * 3] = dotColor.r;
            col[i * 3 + 1] = dotColor.g;
            col[i * 3 + 2] = dotColor.b;
        }

        const seed = hashString(node.id);
        const random = mulberry32(seed);
        const rot: [number, number, number] = [
            (random() - 0.5) * 0.5,
            random() * Math.PI * 2,
            (random() - 0.5) * 0.5,
        ];

        return { positions: pos, colors: col, initialRotation: rot };
    }, [node]);

    useEffect(() => {
        return () => {
            if (geometryRef.current) geometryRef.current.dispose();
            if (materialRef.current) materialRef.current.dispose();
        };
    }, []);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.05;
        }
    });

    return (
        <group position={node.position} rotation={initialRotation}>
            {/* Invisible Hit Sphere for reliable interaction */}
            <mesh
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
                onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
                visible={false}
            >
                <sphereGeometry args={[node.scale * 0.6, 16, 16]} />
                <meshBasicMaterial />
            </mesh>

            <points ref={meshRef}>
                <bufferGeometry ref={geometryRef}>
                    <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                    <bufferAttribute attach="attributes-color" args={[colors, 3]} />
                </bufferGeometry>
                <pointsMaterial
                    ref={materialRef}
                    size={0.6}
                    vertexColors
                    transparent
                    opacity={0.8}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* Render orbiting planets */}
            {node.planets.map(planet => (
                <PlanetSphere
                    key={planet.id}
                    node={planet}
                    isActive={activePlanet?.id === planet.id}
                    onClick={() => onPlanetClick(planet)}
                />
            ))}

            {/* Challenging Content Rim Highlight */}
            {node.hasChallengingContent && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[node.scale * 2.2, node.scale * 2.25, 64]} />
                    <meshBasicMaterial color="#ff4444" transparent opacity={0.3} side={THREE.DoubleSide} />
                </mesh>
            )}
        </group>
    );
}

function Starfield() {
    const pointsRef = useRef<THREE.Points>(null);
    const geometryRef = useRef<THREE.BufferGeometry>(null);
    const materialRef = useRef<THREE.PointsMaterial>(null);

    const positions = useMemo(() => {
        const pos = new Float32Array(STAR_COUNT * 3);
        for (let i = 0; i < STAR_COUNT; i++) {
            // Spherical distribution
            const r = WORLD_RADIUS * Math.cbrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);
        }
        return pos;
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (geometryRef.current) geometryRef.current.dispose();
            if (materialRef.current) materialRef.current.dispose();
        };
    }, []);

    return (
        <points ref={pointsRef}>
            <bufferGeometry ref={geometryRef}>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial
                ref={materialRef}
                size={1.5}
                color={0xffffff}
                transparent
                opacity={0.8}
                sizeAttenuation={true}
            />
        </points>
    );
}

function CameraRig({ activeNode, activePlanet }: { activeNode: GalaxyNode | null, activePlanet: PlanetNode | null }) {
    const { camera, scene, gl } = useThree();
    const controlsRef = useRef<any>(null);
    const [isIdle, setIsIdle] = useState(false);
    const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetIdle = () => {
        setIsIdle(false);
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = setTimeout(() => setIsIdle(true), 8000);
    };

    useEffect(() => {
        const dom = gl.domElement;
        const handleInteraction = () => resetIdle();

        dom.addEventListener('pointerdown', handleInteraction);
        dom.addEventListener('wheel', handleInteraction);
        dom.addEventListener('pointermove', handleInteraction);

        resetIdle();

        return () => {
            dom.removeEventListener('pointerdown', handleInteraction);
            dom.removeEventListener('wheel', handleInteraction);
            dom.removeEventListener('pointermove', handleInteraction);
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        };
    }, [gl.domElement]);

    useFrame((state, delta) => {
        if (!controlsRef.current) return;

        // Idle slow rotation
        if (isIdle && !activeNode && !activePlanet) {
            controlsRef.current.autoRotate = true;
            controlsRef.current.autoRotateSpeed = 0.5;
        } else {
            controlsRef.current.autoRotate = false;
        }

        const targetWorldPos = new THREE.Vector3();

        // Focus transition
        if (activePlanet) {
            const planetObj = scene.getObjectByName(`planet-${activePlanet.id}`);
            if (planetObj) {
                planetObj.getWorldPosition(targetWorldPos);
                controlsRef.current.target.lerp(targetWorldPos, delta * 3);

                // Planet zoom: very close up
                const camTarget = targetWorldPos.clone().add(new THREE.Vector3(0, activePlanet.size * 3, activePlanet.size * 10));
                state.camera.position.lerp(camTarget, delta * 3);
            }
        } else if (activeNode) {
            targetWorldPos.set(...activeNode.position);
            // Move controls target to galaxy center smoothly
            controlsRef.current.target.lerp(targetWorldPos, delta * 3);

            // Move camera to a specific offset relative to the node
            const camTarget = targetWorldPos.clone().add(new THREE.Vector3(0, activeNode.scale * 1.5, activeNode.scale * 4.5));
            state.camera.position.lerp(camTarget, delta * 3);
        }

        controlsRef.current.update();
    });

    return (
        <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            minDistance={60} // hard clamp to prevent entering geometry
            maxDistance={WORLD_RADIUS * 1.5}
            enablePan={false}
        />
    );
}

export default function GalaxyScene({ roadmap }: { roadmap: any }) {
    const galaxyNodes = useMemo(() => transformRoadmapToGalaxies(roadmap, WORLD_RADIUS), [roadmap]);
    const [activeNode, setActiveNode] = useState<GalaxyNode | null>(null);
    const [activePlanet, setActivePlanet] = useState<PlanetNode | null>(null);

    return (
        <div className="w-full h-screen bg-black overflow-hidden relative">
            <Canvas
                camera={{ position: [0, 0, WORLD_RADIUS * 1.5], fov: 45 }}
                onPointerMissed={() => { setActiveNode(null); setActivePlanet(null); }}
            >
                <color attach="background" args={['#050510']} />

                <ambientLight intensity={0.2} />
                <directionalLight position={[0, WORLD_RADIUS, 0]} intensity={1.5} />

                <Starfield />

                {galaxyNodes.map(node => (
                    <GalaxyNodeSpiral
                        key={node.id}
                        node={node}
                        isActive={activeNode?.id === node.id}
                        onClick={() => { setActiveNode(node); setActivePlanet(null); }}
                        activePlanet={activePlanet}
                        onPlanetClick={(p) => { setActiveNode(node); setActivePlanet(p); }}
                    />
                ))}

                <CameraRig activeNode={activeNode} activePlanet={activePlanet} />
            </Canvas>

            {/* 2D OVERLAY */}
            <div
                className={`absolute top-0 right-0 h-full w-96 bg-[var(--color-galaxy-panel)] border-l border-[var(--color-galaxy-border)] shadow-2xl transition-transform duration-500 ease-in-out z-50 ${activePlanet ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {activePlanet && (
                    <div className="p-[var(--spacing-sys-xl)] flex flex-col h-full overflow-y-auto">
                        <button
                            onClick={() => setActivePlanet(null)}
                            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] self-end mb-[var(--spacing-sys-md)] transition-colors"
                        >
                            ✕ Close
                        </button>
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-[var(--spacing-sys-md)]">
                            {activePlanet.title}
                        </h2>

                        <div className="flex flex-col gap-[var(--spacing-sys-sm)]">
                            {activePlanet.subtopics?.length > 0 ? (
                                activePlanet.subtopics.map((st: any) => (
                                    <div key={st.id} className="p-[var(--spacing-sys-md)] bg-black/40 border border-[var(--color-galaxy-border)] rounded-lg">
                                        <h4 className="text-[var(--color-text-primary)] font-medium text-sm">{st.title}</h4>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[var(--color-text-secondary)] text-sm">No subtopics available.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {process.env.NODE_ENV === 'development' && <Stats className="absolute top-0 left-0 z-50" />}
        </div>
    );
}

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const ShootingStar = () => {
    const star = useRef<THREE.Group>(null!);
    const [config] = useState(() => ({
        pos: [Math.random() * 40 - 20, Math.random() * 20 - 10, -10],
        vel: [Math.random() * 0.4 + 0.2, Math.random() * 0.1 - 0.05, 0],
        opacity: Math.random() * 0.5 + 0.5
    }));

    useFrame(() => {
        star.current.position.x += config.vel[0];
        star.current.position.y += config.vel[1];
        if (star.current.position.x > 30) {
            star.current.position.x = -30;
            star.current.position.y = Math.random() * 25 - 12.5;
        }
    });

    return (
        <group ref={star} position={config.pos as any}>
            <mesh>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={config.opacity} />
            </mesh>
        </group>
    );
};

const SceneContent = () => {
    return (
        <>
            <ambientLight intensity={0.5} />

            {/* Background Atmosphere - Pure Minimalist Cosmic Style */}
            <Stars radius={150} depth={50} count={9000} factor={6} saturation={0} fade speed={1.5} />
            <Sparkles count={150} scale={25} size={3} speed={0.4} opacity={0.3} color="#ffffff" />

            {/* Shooting Stars - Increased for more dynamic background */}
            {[...Array(12)].map((_, i) => <ShootingStar key={i} />)}
        </>
    );
};

const AntigravityScene: React.FC = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" style={{ minHeight: '100vh' }}>
            <Canvas
                camera={{ position: [0, 0, 15], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 2]}
            >
                <React.Suspense fallback={null}>
                    <SceneContent />
                    <Environment preset="night" />
                </React.Suspense>
            </Canvas>
        </div>
    );
};

export default AntigravityScene;

// React Three Fiber scene for the 3D Zone Editor.
// Renders: floor grid + reference room geometry + the editable zone quad
// with TransformControls handles. Step-aware: shows the gizmo only during
// the orient/anchor/commit phases.

import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { useZoneEditorStore } from '../stores/zoneEditorStore';

function ZoneQuad() {
  const draft = useZoneEditorStore(s => s.draft);
  const meshRef = useRef();

  const color = useMemo(() => new THREE.Color(draft.color), [draft.color]);

  return (
    <group
      position={draft.position}
      rotation={draft.rotation}
      scale={draft.scale}
    >
      <mesh ref={meshRef}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
        <Edges color={color} lineWidth={2} />
      </mesh>
      {/* Corner indicators */}
      {[[-0.5,-0.5,0],[0.5,-0.5,0],[0.5,0.5,0],[-0.5,0.5,0]].map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function ZoneGizmo({ mode }) {
  const draft = useZoneEditorStore(s => s.draft);
  const updateDraft = useZoneEditorStore(s => s.updateDraft);
  const groupRef = useRef();

  // Sync draft -> object3D
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(...draft.position);
    groupRef.current.rotation.set(...draft.rotation);
    groupRef.current.scale.set(...draft.scale);
  }, [draft.position, draft.rotation, draft.scale]);

  // After TransformControls drag, push values back into the store.
  const handleChange = () => {
    const obj = groupRef.current;
    if (!obj) return;
    updateDraft({
      position: [obj.position.x, obj.position.y, obj.position.z],
      rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
      scale: [obj.scale.x, obj.scale.y, obj.scale.z],
    });
  };

  return (
    <>
      <group ref={groupRef}>
        {/* Lightweight proxy for the gizmo to attach to */}
        <mesh visible={false}>
          <boxGeometry args={[1, 1, 0.01]} />
          <meshBasicMaterial />
        </mesh>
      </group>
      {groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode={mode}
          showZ={mode === 'translate'}
          onObjectChange={handleChange}
        />
      )}
    </>
  );
}

function FloorAndReferenceRoom() {
  return (
    <>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#2c2f36" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Grid overlay */}
      <Grid
        args={[40, 30]}
        cellColor="#2a2f3a"
        sectionColor="#1c1f27"
        position={[0, 0.001, 0]}
        infiniteGrid={false}
        fadeDistance={40}
      />
      {/* Origin marker */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.10, 12]} />
        <meshStandardMaterial color="#ffaa55" emissive="#ff7a30" emissiveIntensity={0.5} />
      </mesh>
    </>
  );
}

function Scene({ step }) {
  const showGizmo = step === 'orient' || step === 'anchor';
  const gizmoMode = step === 'orient' ? 'rotate' : 'translate';

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[12, 18, 8]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-10, 8, -6]} intensity={0.3} color="#88a4ff" />
      <FloorAndReferenceRoom />
      <ZoneQuad />
      {showGizmo && <ZoneGizmo mode={gizmoMode} />}
      <OrbitControls
        target={[0, 0.5, 0]}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI * 0.49}
        minDistance={3}
        maxDistance={40}
      />
    </>
  );
}

export default function ZoneEditor3DScene() {
  const step = useZoneEditorStore(s => s.step);

  return (
    <Canvas
      shadows
      camera={{ position: [10, 8, 14], fov: 38, near: 0.1, far: 200 }}
      style={{ background: '#0a0c10' }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
    >
      <Scene step={step} />
    </Canvas>
  );
}

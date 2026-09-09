import { useGLTF, Float, Clone } from '@react-three/drei';

export default function FloatingBrushes() {
  const { scene } = useGLTF('/paintbrush.glb');

  // Define 1 position for the magical brush
  // [x, y, z]
  const brushes = [
    { position: [-0.9, 1.0, 1.5], rotation: [0.2, 0.4, 0.5], floatIntensity: 1.5, scale: 0.7, lightColor: '#ffd700' }, // Gold
  ];

  return (
    <group>
      {brushes.map((b, i) => (
        <Float 
          key={i} 
          position={b.position as [number, number, number]} 
          speed={1.5 + (i * 0.2)} // offset speed so they aren't synced
          rotationIntensity={b.floatIntensity} 
          floatIntensity={b.floatIntensity}
        >
          {/* Add a magical glowing light attached to each brush */}
          <pointLight color={b.lightColor} intensity={3} distance={4} decay={2} />
          
          {/* We use Clone to instance the same scene multiple times safely */}
          <Clone 
            object={scene} 
            scale={[b.scale, b.scale, b.scale]} 
            rotation={b.rotation as [number, number, number]} 
          />
        </Float>
      ))}
    </group>
  );
}

useGLTF.preload('/paintbrush.glb');

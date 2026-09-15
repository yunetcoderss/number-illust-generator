import { useGLTF, Float, Clone } from '@react-three/drei';

export default function FloatingBrushes() {
  const { scene } = useGLTF('/brush_v2.glb');

  return (
    <group>
      <Float 
        position={[-1.2, 0.9, 0.3]} 
        speed={1.5} 
        rotationIntensity={1.5} 
        floatIntensity={1.5}
      >
        <pointLight intensity={8.0} color="#ffd700" distance={4} decay={2} />
        <Clone 
          object={scene} 
          scale={[0.32, 0.32, 0.32]} 
          rotation={[2.06, -3.14, 1.33]} 
        />
      </Float>
    </group>
  );
}

useGLTF.preload('/brush_v2.glb');
import { useGLTF, Center } from '@react-three/drei';

export default function RoomBackground() {
  const { scene } = useGLTF('/low_poly_bedroom.glb');

  // Hardcoded final values based on user's positioning
  const roomX = 0.8;
  const roomY = -0.4;
  const roomZ = 6.2;
  const roomRotX = -3.14;
  const roomRotY = -3.14;
  const roomRotZ = -3.14;
  const roomScale = 5.53;

  return (
    <group position={[roomX, roomY, roomZ]} rotation={[roomRotX, roomRotY, roomRotZ]}>
      <Center>
        <primitive object={scene} scale={[roomScale, roomScale, roomScale]} />
      </Center>
    </group>
  );
}
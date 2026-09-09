import { useGLTF, Center } from '@react-three/drei';


export default function RoomBackground() {
  const { scene } = useGLTF('/witch_study.glb');

  const roomX = 4.4;
  const roomY = -0.7; // Lowered from 4.9 as requested
  const roomZ = -0.1;
  const roomRotX = -3.14;
  const roomRotY = -3.14;
  const roomRotZ = -3.14;
  const roomScale = 1.38;

  return (
    <group position={[roomX, roomY, roomZ]} rotation={[roomRotX, roomRotY, roomRotZ]}>
      {/* Center is applied locally, the user handles the absolute position via group */}
      <Center>
        <primitive object={scene} scale={[roomScale, roomScale, roomScale]} />
      </Center>
    </group>
  );
}
import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Center, Environment, PresentationControls, Stars, Sparkles, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import RoomBackground from './RoomBackground';
import FloatingBrushes from './FloatingBrushes';

interface FrameProps {
  imageUrl: string;
  onFrameClick?: () => void;
}

function SpaceLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center pointer-events-none">
        <div className="relative flex items-center justify-center">
          {/* Outer orbiting ring */}
          <div className="absolute w-20 h-20 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin"></div>
          {/* Inner core */}
          <div className="w-12 h-12 bg-purple-900/50 backdrop-blur-md rounded-full shadow-[0_0_20px_#8a2be2] animate-pulse flex items-center justify-center">
            <div className="w-3 h-3 bg-purple-200 rounded-full shadow-[0_0_10px_#ffffff]"></div>
          </div>
        </div>
        <p className="mt-5 font-bold tracking-[0.2em] text-xs text-purple-200/80 animate-pulse whitespace-nowrap drop-shadow-[0_0_5px_#8a2be2]">
          LOADING... {progress.toFixed(0)}%
        </p>
      </div>
    </Html>
  );
}

const FrameModel = ({ imageUrl, onFrameClick }: FrameProps) => {
  const { scene } = useGLTF('/frame_v2.glb');
  
  // Hardcoded final values for Frame & Image
  const imgX = 0.00;
  const imgY = 1.03;
  const imgZ = 0.20;
  const imgScale = 1.80;
  const rotX = 0.26;
  const rotY = 0.00;
  const rotZ = -3.14;
  const frameScale = 9.6;
  const flipY = false;

  // Safe texture loading to prevent Suspense crashes on CORS errors
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      imageUrl || '/default_photo.jpg',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = flipY;
        tex.needsUpdate = true;
        
        const a5Aspect = 148 / 210;
        const img = tex.image as HTMLImageElement;
        const imageAspect = img && img.width && img.height ? img.width / img.height : 1;

        if (imageAspect > a5Aspect) {
          const repeatX = a5Aspect / imageAspect;
          tex.repeat.set(repeatX, 1);
          tex.offset.set((1 - repeatX) / 2, 0);
        } else {
          const repeatY = imageAspect / a5Aspect;
          tex.repeat.set(1, repeatY);
          tex.offset.set(0, (1 - repeatY) / 2);
        }
        
        setTexture(tex);
      },
      undefined,
      (err) => {
        console.error("Failed to load texture:", err);
      }
    );
  }, [imageUrl, flipY]);

  // Setup A5 dimensions (Portrait A5 is 148 x 210)
  const a5Aspect = 148 / 210;
  const height = imgScale;
  const width = height * a5Aspect;

  const handlePointerOver = () => {
    if (onFrameClick) document.body.style.cursor = 'pointer';
  };
  const handlePointerOut = () => {
    document.body.style.cursor = 'auto';
  };

  if (!texture) return null;

  return (
    <group 
      onClick={(e) => {
        e.stopPropagation();
        if (onFrameClick) onFrameClick();
      }}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <Center>
        <primitive object={scene} scale={[frameScale, frameScale, frameScale]} />
        {/* We place a plane inside the frame. */}
        <mesh position={[imgX, imgY, imgZ]} rotation={[rotX, rotY, rotZ]}>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial 
            map={texture} 
            emissive="#ffffff"
            emissiveMap={texture}
            emissiveIntensity={0.3} // Slightly lower emissive so reflections pop more
            roughness={0.02} // Extremely smooth for strong glass reflection
            metalness={0.6} // High metalness to simulate highly reflective glossy surface/glass
            side={THREE.DoubleSide} 
          />
        </mesh>
      </Center>
    </group>
  );
};

export default function Frame3D({ imageUrl, onFrameClick }: FrameProps) {
  return (
    <div className="absolute inset-0 w-full h-full z-10 pointer-events-auto" style={{ touchAction: 'none' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} style={{ touchAction: 'none' }}>
        {/* Dark purple ambient light */}
        <ambientLight intensity={0.6} color="#3b1054" />
        
        {/* Magical purple point lights for galaxy vibe (SHADOWS REMOVED FOR PERFORMANCE) */}
        <pointLight position={[0, 2, 2]} intensity={3} color="#8a2be2" />
        <pointLight position={[-5, 5, -5]} intensity={2} color="#d100ff" />
        <pointLight position={[5, -2, 2]} intensity={1.5} color="#ff00ff" />
        
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.5} color="#ffffff" />
        
        <Suspense fallback={<SpaceLoader />}>
          {/* Static Background Room */}
          <RoomBackground />
          <FloatingBrushes />
          
          <Environment preset="night" />
          
          {/* Twinkling Galaxy Stars (Reduced count for performance) */}
          <Stars radius={100} depth={50} count={1000} factor={4} saturation={1} fade speed={1.5} />
          
          {/* Purple Sparkles floating around (Reduced count for performance) */}
          <Sparkles color="#d8b4fe" count={40} scale={12} size={4} speed={0.4} opacity={0.6} />
          
          {/* Rotatable Frame */}
          {imageUrl && (
            <PresentationControls 
              global={true} // Allow dragging anywhere on screen to rotate frame (improves mobile UX)
              cursor={true}
              snap={false}
              speed={1.5}
              zoom={1}
              rotation={[0, Math.PI, 0]} // Starts facing backwards (180 degrees)
              polar={[-Math.PI / 4, Math.PI / 4]}
              azimuth={[-Infinity, Infinity]}
            >
              <FrameModel imageUrl={imageUrl} onFrameClick={onFrameClick} />
            </PresentationControls>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/frame_v2.glb');

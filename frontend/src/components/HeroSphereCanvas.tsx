import { Float, MeshTransmissionMaterial, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

function GlassSphere() {
  return (
    <Float
      speed={1.2}
      rotationIntensity={0.25}
      floatIntensity={0.6}
    >
      <mesh rotation={[0.2, 0.4, 0]}>
        <icosahedronGeometry args={[1.35, 2]} />

        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.35}
          roughness={0.08}
          transmission={1}
          ior={1.35}
          chromaticAberration={0.04}
          anisotropy={0.1}
          color="#dff7e8"
        />
      </mesh>
    </Float>
  )
}

function HeroSphereCanvas() {
  return (
    <Canvas
      camera={{
        position: [0, 0, 5],
        fov: 45,
      }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
      }}
    >
      <ambientLight intensity={1.5} />

      <directionalLight
        position={[3, 3, 4]}
        intensity={2}
      />

      <pointLight
        position={[-3, 1, 2]}
        intensity={2}
        color="#d8f7e5"
      />

      <GlassSphere />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.35}
      />
    </Canvas>
  )
}

export default HeroSphereCanvas
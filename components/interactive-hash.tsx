"use client"

import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { Environment, PresentationControls, Float, ContactShadows, Center, Text3D } from "@react-three/drei"

export function InteractiveHash() {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 6], fov: 40 }} dpr={[1, 2]} className="pointer-events-auto">
        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 8, 4]} intensity={1.2} />
        <pointLight position={[-6, -2, -4]} intensity={0.5} />
        <Suspense fallback={null}>
          <PresentationControls
            global
            cursor
            speed={1.1}
            zoom={0.9}
            rotation={[0, 0, 0]}
            polar={[-Math.PI / 4, Math.PI / 4]}
            azimuth={[-Math.PI / 3, Math.PI / 3]}
          >
            <Float speed={1} rotationIntensity={0.25} floatIntensity={0.6}>
              <Center>
                <Text3D
                  font="/fonts/helvetiker_bold.typeface.json"
                  size={1.6}
                  height={0.35}
                  curveSegments={8}
                  bevelEnabled
                  bevelThickness={0.03}
                  bevelSize={0.03}
                  bevelOffset={0}
                  bevelSegments={3}
                >
                  #
                  <meshPhysicalMaterial color="#d73e0d" metalness={0.55} roughness={0.3} envMapIntensity={0.9} />
                </Text3D>
              </Center>
            </Float>
          </PresentationControls>
          <Environment preset="studio" />
          <ContactShadows position={[0, -1.4, 0]} opacity={0.45} scale={12} blur={2.8} far={6} />
        </Suspense>
      </Canvas>
    </div>
  )
}
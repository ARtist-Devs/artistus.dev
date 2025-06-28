import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, N8AO } from '@react-three/postprocessing';
import { ContactShadows } from '@react-three/drei';
import { a, useTransition, useSpring } from '@react-spring/three';
import { FontLoader, TextGeometry } from 'three-stdlib';

import { create } from 'zustand';
import { BoxGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry, Mesh, MeshStandardMaterial, OctahedronGeometry, SphereGeometry, TetrahedronGeometry, TorusGeometry, Vector3 } from 'three';
interface BoxProps {
  position: [number, number, number];
}

const useStore = create( () => ( {
  items: [
    { position: [0.25, 1.8, -6], r: 0.5, geometry: new SphereGeometry( 1, 32, 32 ) },
    { position: [-1.5, 0, 2], r: 0.2, geometry: new TetrahedronGeometry( 2 ) },
    { position: [1, -0.75, 4], r: 0.3, geometry: new CylinderGeometry( 0.8, 0.8, 2, 32 ) },
    { position: [-0.7, 0.5, 6], r: 0.4, geometry: new ConeGeometry( 1.1, 1.7, 32 ) },
    { position: [0.5, -1.2, -6], r: 0.9, geometry: new SphereGeometry( 1.5, 32, 32 ) },
    { position: [-0.5, 2.5, -2], r: 0.6, geometry: new IcosahedronGeometry( 2 ) },
    { position: [-0.8, -0.75, 3], r: 0.35, geometry: new TorusGeometry( 1.1, 0.35, 16, 32 ) },
    { position: [1.5, 0.5, -2], r: 0.8, geometry: new OctahedronGeometry( 2 ) },
    { position: [-1, -0.5, -6], r: 0.5, geometry: new SphereGeometry( 1.5, 32, 32 ) },
    { position: [1, 1.9, -1], r: 0.2, geometry: new BoxGeometry( 2.5, 2.5, 2.5 ) },
  ],
  material: new MeshStandardMaterial()
} ) );
//@ts-ignore
function Geometry ( { r, position, ...props } ) {
  const ref = useRef( Mesh );
  useFrame( ( state ) => {
    if ( !ref.current ) return;
    //@ts-ignore
    ref.current.rotation.x = ref.current.rotation.y = ref.current.rotation.z += 0.004 * r;
    //@ts-ignore
    ref.current.position.y = position[1] + Math[r > 0.5 ? 'cos' : 'sin']( state.clock.getElapsedTime() * r ) * r;
  } );
  return (
    <group position={ position } ref={ ref }>
      <a.mesh { ...props } />
    </group>
  );
}

function Geometries () {
  //@ts-ignore
  const { items, material } = useStore();
  const transition = useTransition( items, {
    from: { scale: [0, 0, 0], rotation: [0, 0, 0] },
    enter: ( { r } ) => ( { scale: [1, 1, 1], rotation: [r * 3, r * 3, r * 3] } ),
    leave: { scale: [0.1, 0.1, 0.1], rotation: [0, 0, 0] },
    config: { mass: 5, tension: 1000, friction: 100 },
    trail: 100
  } );
  return transition( ( props, { position: [x, y, z], r, geometry } ) => (
    <Geometry position={ [x * 3, y * 3, z] } material={ material } geometry={ geometry } r={ r } { ...props } />
  ) );
}

function Rig () {
  const { camera, mouse } = useThree();
  const vec = new Vector3();
  return useFrame( () => camera.position.lerp( vec.set( mouse.x * 2, mouse.y * 1, camera.position.z ), 0.02 ) );
}

function Box ( props: BoxProps ) {
  // This reference will give us direct access to the mesh
  const meshRef = useRef<Mesh>( null! );
  const [hovered, setHover] = useState( false );
  const [active, setActive] = useState( false );

  // Rotate mesh every frame, this is outside of React's render cycle
  useFrame( ( state, delta ) => ( meshRef.current.rotation.x += delta ) );
  return (
    <mesh
      { ...props }
      ref={ meshRef }
      scale={ active ? 1.5 : 1 }
      onClick={ ( event ) => setActive( !active ) }
      onPointerOver={ ( event ) => setHover( true ) }
      onPointerOut={ ( event ) => setHover( false ) }>
      <boxGeometry args={ [1, 1, 1] } />
      <meshStandardMaterial color={ hovered ? 'hotpink' : '#2f74c0' } />
    </mesh>
  );
}

export default function App () {
  const { color } = useSpring( { color: 0, from: { color: 1 }, config: { friction: 50 }, loop: true } );
  return (
    <Canvas camera={ { position: [0, 0, 15], near: 5, far: 40 } }>
      <color attach="background" args={ ['white'] } />
      <a.fog attach="fog" args={ ['white', 10, 40] } color={ color.to( [0, 0.2, 0.4, 0.7, 1], ['white', 'red', 'white', 'red', 'white'] ) } />
      <ambientLight intensity={ 0.8 } />
      <directionalLight castShadow position={ [2.5, 12, 12] } intensity={ 4 } />
      <pointLight position={ [20, 20, 20] } />
      <pointLight position={ [-20, -20, -20] } intensity={ 5 } />
      <Suspense fallback={ null }>
        <Geometries />
        <ContactShadows position={ [0, -7, 0] } opacity={ 0.75 } scale={ 40 } blur={ 1 } far={ 9 } />
        <EffectComposer >
          <N8AO aoRadius={ 3 } distanceFalloff={ 3 } intensity={ 1 } />
        </EffectComposer>
      </Suspense>
      <Rig />
    </Canvas>
  );
}


//   return (
//     <Canvas
//       style={ { height: '100vh', width: '100vw' } }>
//       <ambientLight intensity={ Math.PI / 2 } />
//       <spotLight position={ [10, 10, 10] } angle={ 0.15 } penumbra={ 1 } decay={ 0 } intensity={ Math.PI } />
//       <pointLight position={ [-10, -10, -10] } decay={ 0 } intensity={ Math.PI } />
//       <Box position={ [-1.2, 0, 0] } />
//       <Box position={ [1.2, 0, 0] } />
//       <OrbitControls />
//     </Canvas>
//   );
// }

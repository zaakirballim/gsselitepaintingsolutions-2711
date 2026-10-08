import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ArchitectureDetails, Foliage, RoomInterior } from './house-details';

type SceneProps = { progress: number; colour: string; reduced: boolean };

function Box({ position, size, colour = '#383e36', ...props }: { position: [number, number, number]; size: [number, number, number]; colour?: string; [key: string]: unknown }) {
  return <mesh position={position} castShadow receiveShadow {...props}><boxGeometry args={size} /><meshStandardMaterial color={colour} roughness={0.7} /></mesh>;
}

function PaintedWall({ position, size, progress, colour }: { position: [number, number, number]; size: [number, number, number]; progress: number; colour: string }) {
  const height = size[1];
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ color: '#a39d90', roughness: 0.82 });
    mat.customProgramCacheKey = () => `paint-${height}`;
    mat.onBeforeCompile = shader => {
      shader.uniforms.paintProgress = { value: 0 };
      shader.uniforms.paintColour = { value: new THREE.Color("#c98160") };
      shader.vertexShader = 'varying vec3 wallPos; varying float wallY;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nwallY = position.y; wallPos = position;');
      shader.fragmentShader = 'varying vec3 wallPos; varying float wallY; uniform float paintProgress; uniform vec3 paintColour;\n' + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>\nfloat painted = 1.0 - smoothstep(paintProgress * ${height + 0.24} - ${height / 2 + 0.12}, paintProgress * ${height + 0.24} - ${height / 2 + 0.04}, wallY);\nfloat grain = fract(sin(dot(wallPos.xy, vec2(127.1, 311.7))) * 43758.5453); diffuseColor.rgb = mix(diffuseColor.rgb * (0.87 + grain * 0.15), paintColour * (0.96 + grain * 0.04), painted);`);
      mat.userData.shader = shader;
    };
    return mat;
  }, [height]);
  useFrame(() => { if (material.userData.shader) { material.userData.shader.uniforms.paintProgress.value = progress; material.userData.shader.uniforms.paintColour.value.set(colour); } });
  return <mesh position={position} material={material} castShadow receiveShadow><boxGeometry args={size} /></mesh>;
}

function Window({ x, y, z, width = 1.15 }: { x: number; y: number; z: number; width?: number }) {
  return <group position={[x, y, z]}>
    {[-1, 1].map(side=><Box key={side} position={[side * (width/2),0,0]} size={[0.055,1.6,0.12]} colour="#22292b"/>)}
    {[-0.8,0.8].map(v=><Box key={v} position={[0,v,0]} size={[width+0.05,0.055,0.12]} colour="#22292b"/>)}
    <mesh position={[0,0,0.035]}><planeGeometry args={[width-0.04,1.53]}/><meshPhysicalMaterial color="#a5c5ce" transparent opacity={0.34} metalness={0.45} roughness={0.06} envMapIntensity={2.2} side={THREE.DoubleSide}/></mesh>
    <Box position={[0,0,0.08]} size={[0.03,1.52,0.035]} colour="#22292b"/>
    <Box position={[0,-0.2,0.08]} size={[width,0.03,0.035]} colour="#22292b"/>
    <Box position={[0,-0.85,0.01]} size={[width+0.18,0.07,0.25]} colour="#b7b5aa"/>
  </group>;
}

function Facade({progress,colour,upper}:{progress:number;colour:string;upper:boolean}) {
 const width=upper?4.5:5.6,depth=upper?3:3.6,center=upper?-0.55:0,y=upper?3.3:1.12,z=upper?-0.4:0;
 const windows=upper?[-2.05,-0.62,0.82]:[-2,-0.65,1.8];
 const half=upper?0.69:0.63;
 const openings=windows.map(x=>[x-half,x+half]);
 if(!upper)openings.push([0.2,1.1]);
 openings.sort((a,b)=>a[0]-b[0]);
 const segments=[];let cursor=center-width/2;
 openings.forEach(([left,right])=>{if(left>cursor)segments.push([cursor,left]);cursor=right;});
 if(cursor<center+width/2)segments.push([cursor,center+width/2]);
 return <group>
   <PaintedWall position={[center,y-0.96,z+depth/2]} size={[width,0.22,0.16]} progress={progress} colour={colour}/>
   <PaintedWall position={[center,y+0.94,z+depth/2]} size={[width,0.22,0.16]} progress={progress} colour={colour}/>
   {segments.map(([a,b],i)=><PaintedWall key={i} position={[(a+b)/2,y,z+depth/2]} size={[b-a,1.7,0.16]} progress={progress} colour={colour}/>)}
   <PaintedWall position={[center,y,z-depth/2]} size={[width,2.05,0.16]} progress={progress} colour={colour}/>
   <PaintedWall position={[center-width/2,y,z]} size={[0.16,2.05,depth]} progress={progress} colour={colour}/>
   <PaintedWall position={[center+width/2,y-0.96,z]} size={[0.16,0.22,depth]} progress={progress} colour={colour}/>
   <PaintedWall position={[center+width/2,y+0.94,z]} size={[0.16,0.22,depth]} progress={progress} colour={colour}/>
   <PaintedWall position={[center+width/2,y,z-depth/2+0.23]} size={[0.16,1.7,0.46]} progress={progress} colour={colour}/>
   <PaintedWall position={[center+width/2,y,z+depth/2-0.17]} size={[0.16,1.7,0.34]} progress={progress} colour={colour}/>
   {!upper&&<PaintedWall position={[center+width/2,y,-0.17]} size={[0.16,1.7,0.28]} progress={progress} colour={colour}/>}
 </group>;
}

function Tree({position,scale=1}:{position:[number,number,number];scale?:number}) {
 return <Foliage position={position} scale={scale}/>;
}

function House({ progress, colour, reduced }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  useFrame((_state, dt) => {
    if (group.current) {
      const turn = 0;
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, turn, 3, dt);
    }
  });
  const paint = reduced ? 1 : Math.min(1, Math.max(0, progress / 0.29));
  return <group ref={group} position={[0, -0.2, 0]}>
    <Box position={[0, -0.18, 0]} size={[9.4, 0.32, 7.3]} colour="#343b2b" />
    <Box position={[0, 0.02, 0]} size={[6.5, 0.16, 4.7]} colour="#a09c88" />
    <Facade progress={paint} colour={colour} upper={false}/>
    <Facade progress={paint} colour={colour} upper/>
    <RoomInterior position={[0, 0.14, 0]} upper={false}/><RoomInterior position={[-0.55, 2.34, -0.4]} upper/>
    <ArchitectureDetails/>
    <Box position={[0, 2.23, 0.25]} size={[6.45, 0.2, 4.6]} colour="#d4d4c6" />
    <Box position={[-0.55, 4.4, -0.4]} size={[5.1, 0.22, 3.55]} colour="#d4d4c6" />
    <Box position={[-0.55, 4.52, -0.4]} size={[4.8, 0.06, 3.3]} colour="#474b42" />
    {[-2.0, -0.65, 1.8].map(x => <Window key={x} x={x} y={1.17} z={1.84} />)}
    <Box position={[0.65, 0.98, 1.86]} size={[0.8, 1.9, 0.1]} colour="#5c4535" />
    <Box position={[0.95, 1.05, 1.94]} size={[0.035, 0.24, 0.035]} colour="#e2c185" />
    {[-2.05, -0.62, 0.82].map(x => <Window key={x} x={x} y={3.3} z={1.13} width={1.25} />)}
    <group rotation={[0, Math.PI / 2, 0]} position={[2.84, 0, 0]}>{[-0.9, 0.55].map(x => <Window key={x} x={x} y={1.15} z={0} />)}</group>
    <group rotation={[0, Math.PI / 2, 0]} position={[1.73, 0, -0.35]}><Window x={0} y={3.3} z={0} width={1.5} /></group>
    <group rotation={[0,Math.PI,0]} position={[0,0,-1.91]}>{[-1.75,0,1.75].map(x=><Window key={x} x={x} y={1.17} z={0} width={1.1}/>)}</group>
    <group rotation={[0,Math.PI,0]} position={[-0.55,0,-2.01]}>{[-1.4,0,1.4].map(x=><Window key={x} x={x} y={3.3} z={0} width={1}/>)}</group>
    <group rotation={[0,-Math.PI/2,0]} position={[-2.89,0,0]}>{[-0.85,0.85].map(x=><Window key={x} x={x} y={1.15} z={0} width={1}/>)}</group>
    <group rotation={[0,-Math.PI/2,0]} position={[-2.89,0,-0.4]}><Window x={0} y={3.3} z={0} width={1.4}/></group>
    {/* Continuous balcony with slender steel balustrades. */}
    {Array.from({ length: 13 }, (_, i) => <Box key={i} position={[-3 + i * 0.5, 2.8, 2.44]} size={[0.035, 1.04, 0.035]} colour="#303a32" />)}
    <Box position={[0, 3.33, 2.44]} size={[6.1, 0.055, 0.06]} colour="#303a32" />
    <Box position={[0, 2.72, 2.44]} size={[6.1, 0.035, 0.04]} colour="#303a32" />
    {[0, 1, 2, 3].map(i => <Box key={i} position={[3.04, 2.8, 2.42 - i * 0.7]} size={[0.04, 1.05, 0.04]} colour="#303a32" />)}
    <Box position={[3.04, 3.33, 1.35]} size={[0.055, 0.055, 2.25]} colour="#303a32" />
    {[-2.9, 2.9].map(x => <Box key={x} position={[x, 1.1, 2.32]} size={[0.09, 2.1, 0.09]} colour="#454e3f" />)}
    {[0, 1, 2].map(i => <Box key={i} position={[0.65, 0.1 - i * 0.07, 2.3 + i * 0.4]} size={[2.2, 0.18, 0.5]} colour="#b4af9a" />)}
    <Box position={[0.65, -0.015, 3.37]} size={[2.2, 0.07, 0.95]} colour="#918f7d" />
    <Tree position={[-3.65, 0, -1.5]} scale={1.25} /><Tree position={[-4, 0, 1.7]} scale={0.8} /><Tree position={[3.5, 0, -2.35]} scale={0.85} />
    {[[-2.4, 2.1], [2.2, 2.1]].map(([x, z], i) => <group key={i} position={[x, 0.18, z]}><Box position={[0, 0.18, 0]} size={[0.55, 0.4, 0.55]} colour="#8e7762" /></group>)}
    <PaintRoller progress={progress} colour={colour} reduced={reduced} />
    <Box position={[-1.55, 2.42, 1.7]} size={[1.1, 0.3, 0.45]} colour="#92714e" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.36, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#09090c" roughness={1} /></mesh>
  </group>;
}

function PaintRoller({ progress, colour, reduced }: SceneProps) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.visible = !reduced && progress > 0.36 && progress < 0.79;
    ref.current.position.set(2.89, 0.25 + Math.min(1, Math.max(0, (progress - 0.42) / 0.31)) * 1.8, 1.54);
  });
  return <group ref={ref} rotation={[0, Math.PI / 2, 0]}>
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.13, 0.13, 0.82, 32]} /><meshStandardMaterial color={colour} roughness={0.9}/></mesh>
    <Box position={[0.48, -0.2, 0.04]} size={[0.035, 0.43, 0.035]} colour="#c5c7c1"/>
    <Box position={[0.25, -0.39, 0.04]} size={[0.48, 0.035, 0.035]} colour="#c5c7c1"/>
    <Box position={[0.03, -0.7, 0.04]} size={[0.1, 0.6, 0.1]} colour="#d5dba2"/>
    <mesh position={[0.03, -1.1, 0.04]}><cylinderGeometry args={[0.025, 0.025, 0.5, 12]}/><meshStandardMaterial color="#94968c" metalness={0.7} roughness={0.3}/></mesh>
  </group>;
}

function CameraRig({ mobile, progress, reduced }: { mobile: boolean; progress: number; reduced: boolean }) {
 const current=useRef(0),offset=useRef(0),smoothOffset=useRef(0);
 const {gl}=useThree();
 useEffect(()=>{
  const canvas=gl.domElement;let dragging=false,lastX=0;
  const down=(e:PointerEvent)=>{if(e.button!==0)return;dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';};
  const move=(e:PointerEvent)=>{if(!dragging)return;offset.current-=(e.clientX-lastX)*0.008;lastX=e.clientX;};
  const up=()=>{dragging=false;canvas.style.cursor='grab';};
  const key=(e:KeyboardEvent)=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();offset.current+=e.key==='ArrowLeft'?-0.18:0.18;}if(e.key==='Home'){e.preventDefault();offset.current=0;}};
  canvas.tabIndex=0;canvas.setAttribute('aria-label','Interactive house. Click and drag left or right to rotate. Arrow keys rotate; Home resets the angle.');canvas.style.cursor='grab';canvas.style.touchAction='pan-y';
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('keydown',key);
  return()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('keydown',key);};
 },[gl]);
 useFrame(({camera},dt)=>{
  current.current=reduced?0:THREE.MathUtils.damp(current.current,progress,4,dt);
  smoothOffset.current=THREE.MathUtils.damp(smoothOffset.current,offset.current,8,dt);
  const p=current.current,angle=p*Math.PI*2+smoothOffset.current;
  const radius=mobile?15.8:16;
  const pos=new THREE.Vector3(Math.sin(angle)*radius,5.4+Math.sin(p*Math.PI)*1.1,Math.cos(angle)*radius);
  const right=new THREE.Vector3(Math.cos(angle),0,-Math.sin(angle));
  const blend=(a:number,b:number)=>THREE.MathUtils.smoothstep(p,a,b);
  const framing=mobile?0:-2.7+5.5*blend(.17,.29)-5.5*blend(.43,.55)+.6*blend(.72,.84);
  const target=new THREE.Vector3(0,mobile?2.5:2.0,0).addScaledVector(right,framing);
  camera.position.copy(pos);camera.lookAt(target);
  (camera as THREE.PerspectiveCamera).fov=mobile?47:43;(camera as THREE.PerspectiveCamera).updateProjectionMatrix();
 });
 return null;
}

function StudioEnvironment() {
 const {gl,scene}=useThree();
 useEffect(()=>{const generator=new THREE.PMREMGenerator(gl);const room=new RoomEnvironment();const texture=generator.fromScene(room,0.06);scene.environment=texture.texture;scene.environmentIntensity=0.4;return()=>{scene.environment=null;texture.dispose();room.dispose();generator.dispose();};},[gl,scene]);
 return null;
}

export default function HouseScene(props: SceneProps & { mobile: boolean }) {
  return <Canvas shadows dpr={[1, 1.4]} camera={{ position: [0, 5.4, 13.7], fov: props.mobile ? 42 : 39 }} gl={{ antialias: true, alpha: true }} aria-label="3D modern house being freshly painted as you scroll">
    <Suspense fallback={null}>
      <CameraRig mobile={props.mobile} progress={props.progress} reduced={props.reduced} />
      <StudioEnvironment/>
      <ambientLight intensity={0.18} />
      <hemisphereLight args={['#e8ebcf', '#25232b', 0.6]} />
      <directionalLight position={[-5, 10, 8]} color="#ffe2b8" intensity={2.7} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-normalBias={0.025} />
      <directionalLight position={[5, 7, -4]} intensity={1.2} color="#becff1" />
      <House {...props} />
      <fog attach="fog" args={['#09090c', 22, 55]} />
    </Suspense>
  </Canvas>;
}
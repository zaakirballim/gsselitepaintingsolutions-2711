import { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
function Detail({p,s,c='#b5b1a3'}:{p:[number,number,number];s:[number,number,number];c?:string}) {
 return <mesh position={p} castShadow receiveShadow><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={0.78}/></mesh>;
}
export function RoomInterior({position,upper}:{position:[number,number,number];upper:boolean}) {
 return <group position={position}>
  <Detail p={[0,0.02,0]} s={[upper?4.3:5.4,0.06,upper?2.8:3.4]} c="#b8a18a"/>
  <Detail p={[0,0.9,-0.9]} s={[2.5,1.8,0.09]} c="#e4dbca"/>
  <Detail p={[-0.8,0.4,-0.25]} s={[1.6,0.4,0.66]} c="#dbd0bb"/>
  <Detail p={[-0.8,0.75,-0.55]} s={[1.6,0.45,0.17]} c="#d0c0a9"/>
  {[-1.55,-0.05].map(x=><Detail key={x} p={[x,0.6,-0.22]} s={[0.15,0.45,0.7]} c="#c8b69f"/>)}
  <Detail p={[0.65,0.28,0.25]} s={[0.9,0.08,0.5]} c="#694b32"/>
  <Detail p={[0.65,0.14,0.25]} s={[0.08,0.28,0.08]} c="#342e28"/>
  <Detail p={[0,0.065,0.2]} s={[2.9,0.015,1.45]} c="#d6d0bb"/>
  <mesh position={[0.6,1.25,-0.83]}><boxGeometry args={[0.65,0.75,0.025]}/><meshStandardMaterial color="#7e8d78"/></mesh>
  <pointLight position={[0,1.7,-0.15]} color="#ffcf91" intensity={2} distance={4} decay={2}/>
  <mesh position={[1.35,1.32,-0.45]}><cylinderGeometry args={[0.2,0.28,0.35,24]}/><meshStandardMaterial color="#f4e5c5" emissive="#f4c57b" emissiveIntensity={0.35}/></mesh>
  <Detail p={[1.35,0.6,-0.45]} s={[0.025,1.1,0.025]} c="#5d5145"/>
 </group>;
}
export function ArchitectureDetails() {
 return <group>
  {/* Vertical timber grain on the front door. */}
  {Array.from({length:12},(_,i)=><Detail key={'door'+i} p={[0.28+i*0.067,1,1.921]} s={[0.004,1.85,0.008]} c="#352a22"/>)}
  {/* Stone pavers with recessed joints and varied tones. */}
  {Array.from({length:5},(_,x)=>Array.from({length:4},(_,z)=><Detail key={`p${x}${z}`} p={[-1.6+x*0.65,-0.006,2.85+z*0.5]} s={[0.635,0.035,0.485]} c={['#929387','#999b8d','#8c9084'][(x+z)%3]}/>))}
  {/* Slim roof fascia, drainage pipes and balcony deck seams. */}
  <Detail p={[-0.55,4.39,1.39]} s={[5.12,0.035,0.028]} c="#7f8278"/>
  <Detail p={[0,2.19,2.53]} s={[6.4,0.035,0.03]} c="#777b71"/>
  <Detail p={[-2.65,1.04,1.92]} s={[0.045,2.1,0.045]} c="#a9aa9b"/>
  {Array.from({length:22},(_,i)=><Detail key={'deck'+i} p={[-2.8+i*0.265,2.341,1.85]} s={[0.012,0.006,1.18]} c="#979584"/>)}
  {[-2,0,2].map(x=><group key={'lamp'+x}><mesh position={[x,2.11,2.12]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.055,0.055,0.03,16]}/><meshStandardMaterial color="#ffe0ae" emissive="#ffcf8b" emissiveIntensity={2}/></mesh><pointLight position={[x,2.03,2.1]} intensity={0.45} color="#ffc689" distance={2.5}/></group>)}
  {/* Thin planter reeds rather than spherical topiary. */}
  {[-2.4,2.2].map(x=>Array.from({length:10},(_,i)=><mesh key={`reed${x}${i}`} position={[x+Math.sin(i*2.4)*0.17,0.83,2.1+Math.cos(i*2.4)*0.17]} rotation={[0,i*1.7,0.1]}><coneGeometry args={[0.035,0.7+(i%3)*0.08,5]}/><meshStandardMaterial color={i%2?'#718055':'#536441'}/></mesh>))}
 </group>;
}
export function Foliage({position,scale}:{position:[number,number,number];scale:number}) {
 const ref=useRef<THREE.InstancedMesh>(null);
 const leaves=useMemo(()=>Array.from({length:200},(_,i)=>{const a=i*2.39996,r=Math.sqrt((i+.5)/200);return {x:Math.cos(a)*r*0.94,z:Math.sin(a)*r*0.77,y:1.8+Math.sin(i*1.7)*0.5+(1-r)*0.85,size:0.16+(i%4)*0.025};}),[]);
 useLayoutEffect(()=>{if(!ref.current)return;const dummy=new THREE.Object3D();leaves.forEach((l,i)=>{dummy.position.set(l.x,l.y,l.z);dummy.rotation.set(i*.3,i*2.4,i*.2);dummy.scale.set(l.size,l.size*.24,l.size*.75);dummy.updateMatrix();ref.current!.setMatrixAt(i,dummy.matrix);ref.current!.setColorAt(i,new THREE.Color(['#34452e','#4a5d3d','#3b5032','#6a7751'][i%4]));});ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;},[leaves]);
 return <group position={position} scale={scale}>
  <mesh position={[0,1.05,0]} castShadow><cylinderGeometry args={[0.055,0.14,2.1,12]}/><meshStandardMaterial color="#645446" roughness={1}/></mesh>
  {[0,1,2,3].map(i=><mesh key={i} position={[Math.sin(i*2)*0.2,1.6,Math.cos(i*2)*0.2]} rotation={[0,0,Math.sin(i*2)*0.5]}><cylinderGeometry args={[0.018,0.055,1,8]}/><meshStandardMaterial color="#665443"/></mesh>)}
  <instancedMesh ref={ref} args={[undefined,undefined,200]} castShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial roughness={0.92}/></instancedMesh>
 </group>;
}

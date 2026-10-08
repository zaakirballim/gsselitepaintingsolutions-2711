import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { ArrowUpRight, ArrowDown, Phone, Mail, MapPin, MoveHorizontal } from 'lucide-react';
import { scrollFinish } from '../lib/paint-colours';
const HouseScene = lazy(() => import('../components/house-scene'));
const services = ['Residential painting','Commercial painting','Industrial painting','Roof painting','Interior & exterior painting','Waterproofing','Wall & crack repairs','High pressure cleaning','Renovations'];
const stages = [
 {eyebrow:'A FRESH START. A FINER FINISH.',title:<>Colour that<br/>changes <em>everything.</em></>,description:'From the first brushstroke to the final detail. Painting that brings your home to life.',label:'Home'},
 {eyebrow:'01 / OUR SERVICES',title:<>We paint your world<br/><em>with pride.</em></>,description:'From a single room to your whole property.',label:'Services'},
 {eyebrow:'02 / COLOUR. CARE. PROTECTION.',title:<>More than colour.<br/><em>A finish that matters.</em></>,description:'We clean and prepare your surfaces, repair walls and cracks, and bring fresh colour to your space. Painting and waterproofing, thoughtfully done.',label:'Our approach'},
 {eyebrow:'03 / MADE TO FEEL LIKE HOME',title:<>Your home.<br/> <em>Only better.</em></>,description:'A fresh look for the place you love. Let’s talk about your space and the finish you have in mind.',label:'Contact'},
];
export default function Landing() {
 const story=useRef<HTMLDivElement>(null);
 const [progress,setProgress]=useState(0),[mobile,setMobile]=useState(false),[reduced,setReduced]=useState(false);
 useEffect(()=>{
  let queued=false;
  const measure=()=>{setMobile(innerWidth<760);setReduced(matchMedia('(prefers-reduced-motion: reduce)').matches);};
  const scroll=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{if(story.current){const r=story.current.getBoundingClientRect();setProgress(Math.max(0,Math.min(1,-r.top/(r.height-innerHeight))));}queued=false;});};
  measure();scroll();window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',measure);
  return()=>{window.removeEventListener('scroll',scroll);window.removeEventListener('resize',measure);};
 },[]);
 const stage=Math.min(3,Math.floor(progress*4));
 const jump=(n:number)=>{if(story.current)window.scrollTo({top:story.current.offsetTop+(story.current.offsetHeight-innerHeight)*(n===0?0:n/4+0.055),behavior:reduced?'instant':'smooth'});};
 return <>
  <header className="site-header"><a className="brand" href="#home" onClick={e=>{e.preventDefault();jump(0);}} aria-label="GSS Elite home"><span className="brand-mark">g<span>ss</span><i/></span><span className="brand-name">ELITE PAINTS<br/><span>& SOLUTIONS</span></span></a><nav aria-label="Story navigation">{[0,1,3].map(n=><button key={n} onClick={()=>jump(n)} aria-current={stage===n?'page':undefined}>{stages[n].label}</button>)}</nav><button className="header-cta" onClick={()=>jump(3)}>Free quotation <ArrowUpRight size={15}/></button></header>
  <main><div className="scroll-story tour-only" id="home" ref={story}><div className={`story-viewport stage-${stage}`}>
   <div className="light-ribbons" aria-hidden="true"><div className="ribbon ribbon-a"/><div className="ribbon ribbon-b"/><div className="ribbon ribbon-c"/></div>
   <div className="scene"><Suspense fallback={<div className="scene-loading">Bringing your home to life…</div>}><HouseScene progress={progress} colour={scrollFinish(progress).colour} reduced={reduced} mobile={mobile}/></Suspense></div>
   <div className="scene-vignette"/>
   <div className="hero-copy" key={stage}><p className="eyebrow"><span/>{stages[stage].eyebrow}</p><h1>{stages[stage].title}</h1><p className="hero-description">{stages[stage].description}</p>
    {stage===0&&<button className="pill primary" onClick={()=>jump(1)}>Explore our services<ArrowUpRight size={18}/></button>}
    {stage===1&&<ul className="scroll-services">{services.map((s,i)=><li key={s}><span>{String(i+1).padStart(2,'0')}</span>{s}</li>)}</ul>}
    {stage===2&&<div className="approach-steps"><span>01 / Prepare</span><span>02 / Paint</span><span>03 / Protect</span></div>}
    {stage===3&&<a className="pill primary" href="tel:+27797113674">Let’s paint your story<ArrowUpRight size={18}/></a>}
   </div>
   {stage===3&&<aside className="scroll-contact" aria-label="Contact details"><p className="eyebrow"><span/>LET’S TALK / FREE QUOTATIONS</p><a href="tel:+27797113674"><Phone size={17}/><span>079 711 3674</span><ArrowUpRight size={14}/></a><a href="mailto:gsspaintingsolution@gmail.com"><Mail size={17}/><span>gsspaintingsolution@gmail.com</span><ArrowUpRight size={14}/></a><a href="https://www.google.com/maps/search/?api=1&query=1571+Raven+Street+Johannesburg+Gauteng" target="_blank" rel="noreferrer"><MapPin size={17}/><span>1571 Raven Street<br/>Johannesburg, Gauteng</span><ArrowUpRight size={14}/></a></aside>}
   <div className="stage-nav" aria-label="Tour chapters">{stages.map((s,i)=><button key={s.label} onClick={()=>jump(i)} className={stage===i?'active':''} aria-label={`View ${s.label}`} aria-current={stage===i?'step':undefined}><span>0{i+1}</span><i/></button>)}</div>
   <div className="story-bottom"><button onClick={()=>jump(stage===3?0:stage+1)}><span className="scroll-icon"><ArrowDown size={14}/></span>{stage===3?'BACK TO THE BEGINNING':'SCROLL TO EXPLORE'}</button><span className="drag-hint"><MoveHorizontal size={17}/>CLICK & DRAG TO LOOK AROUND</span></div>
   <div className="progress-track"><div style={{width:`${progress*100}%`}}/></div>
  </div></div></main>
 </>;
}

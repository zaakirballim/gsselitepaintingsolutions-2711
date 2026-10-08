export const finishes = [{name:'Terracotta', colour:'#c98160'}, {name:'Sage', colour:'#829778'}, {name:'Coastal blue', colour:'#648e9c'}, {name:'Warm ivory', colour:'#eee0be'}];
const stops = [{at:0, ...finishes[1]}, {at:0.32,...finishes[1]}, {at:0.54,...finishes[2]}, {at:0.77,...finishes[0]}, {at:1,...finishes[3]}];
export function scrollFinish(progress:number) {
 const index=Math.min(stops.length-2, Math.max(0,stops.findLastIndex(s=>s.at<=progress)));
 const a=stops[index],b=stops[index+1];let t=Math.max(0,Math.min(1,(progress-a.at)/(b.at-a.at)));t=t*t*(3-2*t);
 const values=[1,3,5].map(i=>Math.round(parseInt(a.colour.slice(i,i+2),16)*(1-t)+parseInt(b.colour.slice(i,i+2),16)*t).toString(16).padStart(2,'0'));
 return {colour:'#'+values.join(''),name:(t<.5?a:b).name};
}

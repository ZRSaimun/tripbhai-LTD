export const bounded=(v:number)=>Math.max(0,Math.min(1,v));
export const ease=(v:number)=>{const t=bounded(v);return t*t*(3-2*t)};
/** All cinematic orientation derives from section progress, never accumulated scroll deltas. */
export function earthPose(value:number){const p=bounded(value),near=ease((p-.48)/.24)*(1-ease((p-.76)/.24));return {progress:p,rotation:[.3+ease(p/.26)*.38,-1.18-ease(p/.28)*.4-ease((p-.3)/.3)*.45,.06],cameraZ:3.35-near*.68+ease((p-.82)/.18)*.45,offsetX:ease((p-.82)/.18)*.32,routes:[0,1,2].map(i=>Math.round(81*ease((p-.23-i*.035)/.26))),flight:bounded((p-.28)/.43)}};

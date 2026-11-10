import {earthPose} from './earth-motion';
import * as THREE from 'three';
export const destinations=[{name:'London',lat:51.507,lng:-.128},{name:'Dubai',lat:25.205,lng:55.271},{name:'Dhaka',lat:23.81,lng:90.413},{name:'Rome',lat:41.902,lng:12.496}];
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t)};
export async function createEarth(mount:HTMLElement,section:HTMLElement,onReady:()=>void,onFail:()=>void,onTravel:(city:string,distance:number)=>void=()=>{}){
 let disposed=false,paused=false,visible=true,frame=0,last=0,idle=0,target=0,progress=0,focus=-1,slowFrames=0;
 let exploring=false,latitude=35,longitude=15,heading=0,speed=0,travelled=0,report=0;const keys=new Set<string>();
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x071b29,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.domElement.setAttribute('aria-hidden','true');mount.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,30);camera.position.set(0,0,3.4);
 const scrollGroup=new THREE.Group(),idleGroup=new THREE.Group();scrollGroup.add(idleGroup);scene.add(scrollGroup);
 const texture=new THREE.TextureLoader().load('/images/earth-nasa-2048.jpg',()=>{if(!disposed){onReady();renderer.render(scene,camera);wake()}},undefined,onFail);texture.colorSpace=THREE.SRGBColorSpace;
 const globe=new THREE.Mesh(new THREE.SphereGeometry(1,64,40),new THREE.MeshPhongMaterial({map:texture,shininess:9,specular:0x26425a}));idleGroup.add(globe);
 scene.add(new THREE.AmbientLight(0xcbdde7,1.4));const sun=new THREE.DirectionalLight(0xfff5e1,2.6);sun.position.set(-3,3,4);scene.add(sun);
 const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(1.022,48,32),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,vertexShader:'varying vec3 vNormal; varying vec3 vPosition; void main(){vNormal=normalize(normalMatrix*normal); vec4 p=modelViewMatrix*vec4(position,1.0);vPosition=p.xyz;gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vNormal; varying vec3 vPosition; void main(){float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(-vPosition))),3.0);gl_FragColor=vec4(0.15,0.65,0.88,rim*0.52);}'}));idleGroup.add(atmosphere);
 const point=(lat:number,lng:number,r=1.015)=>new THREE.Vector3(Math.cos(lat*Math.PI/180)*Math.cos(lng*Math.PI/180)*r,Math.sin(lat*Math.PI/180)*r,-Math.cos(lat*Math.PI/180)*Math.sin(lng*Math.PI/180)*r);
 const markers=destinations.map(d=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.015,10,8),new THREE.MeshBasicMaterial({color:0xe6c47e}));m.position.copy(point(d.lat,d.lng));idleGroup.add(m);return m});
 const start=point(destinations[0].lat,destinations[0].lng);const routes=destinations.slice(1).map(d=>{const end=point(d.lat,d.lng);const points=Array.from({length:81},(_,i)=>start.clone().lerp(end,i/80).normalize().multiplyScalar(1.018+.2*Math.sin(Math.PI*i/80)));const geo=new THREE.BufferGeometry().setFromPoints(points);geo.setDrawRange(0,0);const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x8ad5bf,transparent:true,opacity:.85}));idleGroup.add(line);return {line,points}});
 const aircraft=new THREE.Mesh(new THREE.SphereGeometry(.022,10,8),new THREE.MeshBasicMaterial({color:0xffffff}));idleGroup.add(aircraft);
 const vehicle=new THREE.Group();
 const hull=new THREE.Mesh(new THREE.ConeGeometry(.018,.075,8),new THREE.MeshStandardMaterial({color:0xffd592,metalness:.3,roughness:.4}));hull.rotation.x=Math.PI/2;vehicle.add(hull);
 const wings=new THREE.Mesh(new THREE.BoxGeometry(.085,.006,.022),new THREE.MeshStandardMaterial({color:0xf7f6f0}));vehicle.add(wings);idleGroup.add(vehicle);vehicle.visible=false;
 const trailPoints:Array<THREE.Vector3>=[];const trailGeometry=new THREE.BufferGeometry();trailGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(140*3),3));trailGeometry.setDrawRange(0,0);const trail=new THREE.Line(trailGeometry,new THREE.LineBasicMaterial({color:0xffd592,transparent:true,opacity:.65}));idleGroup.add(trail);
 function clearKeys(){keys.clear()}
 function keydown(e:KeyboardEvent){if(!exploring||paused)return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){e.preventDefault();keys.add(k)}}
 function keyup(e:KeyboardEvent){keys.delete(e.key.toLowerCase())}
 mount.tabIndex=0;mount.setAttribute('role','group');mount.setAttribute('aria-label','Travel explorer. Use arrow keys or W A S D to fly. Tab to leave.');mount.addEventListener('keydown',keydown);mount.addEventListener('keyup',keyup);mount.addEventListener('blur',clearKeys);window.addEventListener('blur',clearKeys);
 function resize(){if(disposed)return;const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();wake()}
 function scroll(){const box=section.getBoundingClientRect();target=clamp(-box.top/Math.max(1,section.offsetHeight-innerHeight));if(!exploring)focus=-1;wake()}
 function draw(t:number){frame=0;if(disposed||document.hidden||!visible)return;const dt=last?Math.min((t-last)/1000,.05):.016;last=t;
  if(!paused){progress+=(target-progress)*Math.min(1,dt*9);idle+=dt*.009;const p=progress;const pose=earthPose(p);
   if(!exploring&&focus<0)scrollGroup.rotation.set(pose.rotation[0],pose.rotation[1],pose.rotation[2]);
   if(!exploring&&focus>=0){const d=destinations[focus];scrollGroup.rotation.x+=(d.lat*Math.PI/180-scrollGroup.rotation.x)*Math.min(1,dt*5);scrollGroup.rotation.y+=(-Math.PI/2+d.lng*Math.PI/180-scrollGroup.rotation.y)*Math.min(1,dt*5);scrollGroup.rotation.z*=Math.max(0,1-dt*5)}
   idleGroup.rotation.y=Math.sin(idle)*.016; // Separate bounded idle offset: scroll orientation stays deterministic.
   camera.position.z=pose.cameraZ;scrollGroup.position.x=pose.offsetX;
   routes.forEach((r,i)=>r.line.geometry.setDrawRange(0,pose.routes[i]));markers.forEach((m,i)=>m.visible=i===0?p>.12:p>.26+i*.03);
   const flight=pose.flight;aircraft.visible=p>.28&&p<.85;const index=flight*80,lo=Math.floor(index);aircraft.position.copy(routes[1].points[lo]).lerp(routes[1].points[Math.min(80,lo+1)],index-lo);
   if(exploring){
    const turn=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);
    heading+=turn*dt*1.6;const braking=keys.has('arrowdown')||keys.has('s');const accelerating=keys.has('arrowup')||keys.has('w');speed+=( (braking?0:accelerating?12:4)-speed)*Math.min(1,dt*2);
    latitude=THREE.MathUtils.clamp(latitude+Math.cos(heading)*speed*dt,-75,75);longitude+=Math.sin(heading)*speed*dt/Math.max(.3,Math.cos(latitude*Math.PI/180));longitude=((longitude+180)%360+360)%360-180;travelled+=speed*dt;
    const pos=point(latitude,longitude,1.045);vehicle.visible=true;vehicle.position.copy(pos);vehicle.up.copy(pos).normalize();vehicle.lookAt(point(latitude+Math.cos(heading)*.1,longitude+Math.sin(heading)*.1,1.045));
    if(t-report>180){trailPoints.push(pos.clone());if(trailPoints.length>140)trailPoints.shift();const positions=trailGeometry.getAttribute('position') as THREE.BufferAttribute;trailPoints.forEach((v,i)=>positions.setXYZ(i,v.x,v.y,v.z));positions.needsUpdate=true;trailGeometry.setDrawRange(0,trailPoints.length);trailGeometry.computeBoundingSphere();report=t;const nearest=destinations.map(d=>({name:d.name,distance:point(d.lat,d.lng).angleTo(pos)*180/Math.PI})).sort((a,b)=>a.distance-b.distance)[0];onTravel(nearest.distance<12?nearest.name:'',Math.round(travelled*111));}
    scrollGroup.rotation.x+=(latitude*Math.PI/180-scrollGroup.rotation.x)*Math.min(1,dt*3);const desired=-Math.PI/2+longitude*Math.PI/180;let delta=desired-scrollGroup.rotation.y;delta=Math.atan2(Math.sin(delta),Math.cos(delta));scrollGroup.rotation.y+=delta*Math.min(1,dt*3);scrollGroup.rotation.z*=Math.max(0,1-dt*3);scrollGroup.position.x=0;camera.position.z=2.7;idleGroup.rotation.y=0;markers.forEach(m=>m.visible=true);routes.forEach(r=>r.line.geometry.setDrawRange(0,81));aircraft.visible=false;
   }else{vehicle.visible=false}
   mount.dataset.progress=p.toFixed(3);mount.dataset.stage=String(Math.min(3,Math.floor(p*4)));
  }
  const begin=performance.now();renderer.render(scene,camera);if(performance.now()-begin>28&&++slowFrames>25){renderer.setPixelRatio(1);slowFrames=0}
  if(!paused)frame=requestAnimationFrame(draw);
 }
 function wake(){if(!frame&&!disposed&&!document.hidden&&visible){last=0;frame=requestAnimationFrame(draw)}}
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0}},{rootMargin:'80px'});observer.observe(section);
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(mount);
 const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0}else wake()};const lost=(e:Event)=>{e.preventDefault();onFail();cancelAnimationFrame(frame);frame=0};renderer.domElement.addEventListener('webglcontextlost',lost);document.addEventListener('visibilitychange',visibility);window.addEventListener('scroll',scroll,{passive:true});resize();scroll();
 return {explore(value:boolean){exploring=value;clearKeys();trail.visible=value;if(value)mount.focus({preventScroll:true});wake()},input(key:string,down:boolean){if(down)keys.add(key);else keys.delete(key);wake()},pause(value:boolean){paused=value;mount.dataset.paused=String(value);if(value){cancelAnimationFrame(frame);frame=0}else wake()},focus(index:number){focus=index;if(exploring){latitude=destinations[index].lat;longitude=destinations[index].lng;trailPoints.length=0;trailGeometry.setDrawRange(0,0)}wake()},dispose(){disposed=true;mount.removeEventListener('keydown',keydown);mount.removeEventListener('keyup',keyup);mount.removeEventListener('blur',clearKeys);window.removeEventListener('blur',clearKeys);cancelAnimationFrame(frame);observer.disconnect();resizeObserver.disconnect();window.removeEventListener('scroll',scroll);document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse((obj:any)=>{obj.geometry?.dispose();if(obj.material)for(const m of Array.isArray(obj.material)?obj.material:[obj.material])m.dispose()});texture.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}};
}

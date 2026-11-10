import { env } from 'cloudflare:workers';
import type { Actor } from './model';
export const runtime=()=>env as unknown as Record<string,any>;
export function db(){const d=runtime().DB;if(!d)throw new Fault(503,'Database temporarily unavailable. Your input has not been discarded.');return d;}
export class Fault extends Error{constructor(public status:number,message:string){super(message)}}
export const uid=()=>crypto.randomUUID();
export const now=()=>Date.now();
export const q=(sql:string,...args:any[])=>db().prepare(sql).bind(...args);
export const one=async(sql:string,...args:any[])=>await q(sql,...args).first();
export const many=async(sql:string,...args:any[])=>(await q(sql,...args).all()).results;
export const run=async(sql:string,...args:any[])=>await q(sql,...args).run();
export async function hash(value:string|ArrayBuffer){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',typeof value==='string'?new TextEncoder().encode(value):value))].map(v=>v.toString(16).padStart(2,'0')).join('')}
export function check(test:unknown,status:number,message:string):asserts test{if(!test)throw new Fault(status,message)}
export function output(value:unknown,status=200,headers:Record<string,string>={}){return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...headers}})}
export async function body(request:Request){check(Number(request.headers.get('content-length')||0)<=32000,413,'Request is too large.');const bytes=await readBounded(request,32000);try{return JSON.parse(new TextDecoder().decode(bytes))}catch{throw new Fault(400,'Invalid request.')}}
export async function readBounded(request:Request,max:number){const reader=request.body?.getReader();check(reader,400,'Empty request.');let count=0;const chunks:Uint8Array[]=[];for(;;){const {value,done}=await reader.read();if(done)break;count+=value.length;if(count>max){await reader.cancel();throw new Fault(413,'File exceeds the upload limit.')}chunks.push(value)}const all=new Uint8Array(count);let i=0;for(const c of chunks){all.set(c,i);i+=c.length}return all;}
export function protect(request:Request){if(['GET','HEAD'].includes(request.method))return;const origin=request.headers.get('origin');check(origin===new URL(request.url).origin,403,'Please submit this request from Trip Bhai.');check(request.headers.get('sec-fetch-site')!=='cross-site',403,'Cross-site request blocked.');}
export async function rate(key:string,limit=30){await run('DELETE FROM rate_limits WHERE expires_at<?',now());const slot=Math.floor(now()/60000);const id=await hash(`${key}:${slot}`);const r=await q('INSERT INTO rate_limits(id,count,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count',id,now()+120000).first();check(r.count<=limit,429,'Too many requests. Please try again shortly.');}
export async function actor(request:Request,required=true):Promise<Actor|null>{
 // These headers are stripped/replaced by Sites dispatch. Never deploy this Worker on an untrusted direct origin.
 const subject=request.headers.get('oai-authenticated-user-id');const email=request.headers.get('oai-authenticated-user-email');
 if(!subject||!email){if(required)throw new Fault(401,'Sign in to continue.');return null;}
 let row=await one('SELECT * FROM accounts WHERE subject=?',subject);
 if(!row){await run('INSERT OR IGNORE INTO accounts(id,subject,email,role,created_at) VALUES (?,?,?,\'client\',?)',uid(),subject,email,now());row=await one('SELECT * FROM accounts WHERE subject=?',subject)}
 check(row.active,403,'Your access has been revoked. Contact Trip Bhai.');
 let mfa=false;const token=request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-trip_staff=([^;]+)/)?.[1];
 if(token){const session=await one('SELECT hash FROM staff_sessions WHERE hash=? AND account_id=? AND epoch=? AND expires_at>?',await hash(token),row.id,row.epoch,now());mfa=!!session}
 return {...row,mfa};
}
export function staff(a:Actor,allowed=['owner','manager','caseworker']){check(allowed.includes(a.role),403,'This action is outside your permissions.');check(a.mfa,403,'Complete staff multi-factor authentication first.');}
export async function caseFor(a:Actor,id:string,finance=false){const c=await one('SELECT * FROM cases WHERE id=?',id);check(c,404,'Case not found.');check(c.status!=='Deletion in progress',423,'This case is locked for reviewed deletion.');
 if(a.role==='owner'){staff(a);return c;}
 if(a.role==='finance'){staff(a,['finance']);check(finance,403,'Finance accounts cannot access case documents.');const grant=await one('SELECT id FROM case_access WHERE case_id=? AND account_id=? AND scope=\'finance\'',id,a.id);check(grant,404,'Case not found.');return c;}
 if(['manager','caseworker'].includes(a.role)){staff(a);const grant=await one('SELECT id FROM case_access WHERE case_id=? AND account_id=? AND scope=\'case\'',id,a.id);check(c.assignee===a.id||grant,404,'Case not found.');return c;}
 check(a.role==='client',404,'Case not found.');const client=await one('SELECT id FROM clients WHERE id=? AND account_id=?',c.client_id,a.id);const grant=await one('SELECT id FROM case_access WHERE case_id=? AND account_id=? AND scope=\'client\'',id,a.id);check(client||grant,404,'Case not found.');return c;}
export async function applicantFor(a:Actor,c:any,id:string){const p=await one('SELECT * FROM applicants WHERE id=? AND case_id=?',id,c.id);check(p,404,'Applicant not found.');if(a.role!=='client')return p;check(p.account_id===a.id,403,'This applicant has not explicitly authorised your access.');return p;}
export const auditStatement=(a:Actor|null,action:string,target:string,caseId:string|null=null,detail:object={})=>q('INSERT INTO audit_events(id,actor,case_id,action,target,detail,created_at) VALUES(?,?,?,?,?,?,?)',uid(),a?.id||'visitor',caseId,action,target,JSON.stringify(detail),now());
export async function audit(a:Actor|null,action:string,target:string,caseId:string|null=null,detail:object={}){await auditStatement(a,action,target,caseId,detail).run()}
export async function cas(a:Actor,c:any,revision:number,action:string,statements:(key:string)=>any[]){const key=uid();const result=await db().batch([q('UPDATE cases SET revision=revision+1,mutation_key=?,updated_at=? WHERE id=? AND revision=? RETURNING revision',key,now(),c.id,revision),...statements(key),q('INSERT INTO audit_events(id,actor,case_id,action,target,detail,created_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM cases WHERE id=? AND mutation_key=?)',uid(),a.id,c.id,action,c.id,'{}',now(),c.id,key)]);check(result[0].results?.length,409,'Another person updated this case. Refresh and review their changes before saving.');return {revision:revision+1};}
export async function cipher(value:string,decrypt=false){const raw=runtime().MFA_ENCRYPTION_KEY;check(typeof raw==='string',503,'Staff MFA encryption has not been configured.');let bytes:Uint8Array;try{bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0))}catch{throw new Fault(503,'MFA key configuration is invalid.')};check(bytes.length===32,503,'MFA key must contain 32 random bytes.');const key=await crypto.subtle.importKey('raw',bytes.buffer as ArrayBuffer,'AES-GCM',false,['encrypt','decrypt']);if(decrypt){const data=Uint8Array.from(atob(value),c=>c.charCodeAt(0));return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:data.slice(0,12)},key,data.slice(12)))}const iv=crypto.getRandomValues(new Uint8Array(12));const data=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(value)));return btoa(String.fromCharCode(...iv,...data));}
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const newTotp=()=>{let bits='';for(const b of crypto.getRandomValues(new Uint8Array(20)))bits+=b.toString(2).padStart(8,'0');return bits.match(/.{5}/g)!.map(x=>alphabet[parseInt(x,2)]).join('')};
export async function totp(secret:string,step:number){const bits=[...secret].map(c=>alphabet.indexOf(c).toString(2).padStart(5,'0')).join('');const bytes=new Uint8Array(bits.match(/.{8}/g)!.map(x=>parseInt(x,2)));const key=await crypto.subtle.importKey('raw',bytes,{name:'HMAC',hash:'SHA-1'},false,['sign']);const input=new Uint8Array(8);new DataView(input.buffer).setUint32(4,step);const mac=new Uint8Array(await crypto.subtle.sign('HMAC',key,input));const offset=mac[19]&15;return String(((mac[offset]&127)*2**24+mac[offset+1]*2**16+mac[offset+2]*256+mac[offset+3])%1000000).padStart(6,'0')}

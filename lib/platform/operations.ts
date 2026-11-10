import {workflows} from './model';
import {captureBackup} from './backup';
import { z } from 'zod';
import { check,one,many,run,q,db,staff,uid,now,output,body,cas,audit,runtime,hash,Fault } from './security';
import type { Actor } from './model';
const parse=(schema:any,value:any)=>{const r=schema.safeParse(value);check(r.success,400,'Check the required fields.');return r.data};
const id=z.string().uuid(),revision=z.number().int().positive();
export async function extraCase(request:Request,a:Actor,c:any,action:string,d:any){
 if(request.method!=='POST')return null;
 if(action==='submit-review'){
  check(a.role==='client',403,'This action belongs to the client.');const data=parse(z.object({revision,confirmed:z.literal(true)}),d);
  check(c.authority_at,409,'Record your case-handling authority before submitting.');
  const pending=await one("SELECT COUNT(*) n FROM checklist_items i JOIN applicants p ON p.id=i.applicant_id WHERE i.case_id=? AND p.account_id=? AND i.requirement='required' AND i.status NOT IN('uploaded','checking','accepted')",c.id,a.id);
  check(!pending.n,409,'Please provide the requested documents, or message the team about anything unavailable.');
  const next=c.kind==='visa'&&c.status==='Awaiting documents'?'Documents received':c.status;
  return output(await cas(a,c,data.revision,'client.submitted-to-trip-bhai',key=>[q('UPDATE cases SET status=? WHERE id=? AND mutation_key=?',next,c.id,key)]));
 }
 if(action==='quote-accept'){
  check(a.role==='client',403,'Only the client can accept a quotation.');const data=parse(z.object({revision,quoteId:id,confirmed:z.literal(true)}),d);
  const quote=await one('SELECT * FROM quotes WHERE id=? AND case_id=?',data.quoteId,c.id);check(quote&&quote.expires_at>now(),409,'The quote has expired. Ask for an updated quotation.');
  check(quote.status!=='accepted',409,'This quotation was already accepted.');
  return output(await cas(a,c,data.revision,'quote.client-accepted',key=>[q("UPDATE quotes SET status='accepted',revision=revision+1 WHERE id=? AND EXISTS(SELECT 1 FROM cases WHERE id=? AND mutation_key=?)",quote.id,c.id,key)]));
 }
 return null;
}
export async function extraAdmin(request:Request,a:Actor,key:string,action:string){
 const method=request.method;
 if(key==='workflows'){
  staff(a,['owner','manager']);if(method==='GET')return output({defaults:workflows,entries:await many("SELECT * FROM settings WHERE id LIKE 'workflow:%'")});
  const d=parse(z.object({kind:z.enum(['visa','flight','travel','mentoring']),phases:z.array(z.string().trim().min(1).max(80)).min(4).max(24),revision:z.number().int().nonnegative()}),await body(request));
  const required=workflows[d.kind];check(new Set(d.phases).size===d.phases.length&&JSON.stringify(d.phases.filter((p:string)=>required.includes(p)))===JSON.stringify(required)&&d.phases[0]===required[0],400,'Keep all protected stages in their original order; add operational stages between them.');
  const id='workflow:'+d.kind,value=JSON.stringify({phases:d.phases}),old=await one('SELECT revision FROM settings WHERE id=?',id);
  if(old)check(await q('UPDATE settings SET value=?,revision=revision+1 WHERE id=? AND revision=? RETURNING id',value,id,d.revision).first(),409,'Workflow changed. Reload first.');else{check(d.revision===0,409,'Workflow revision mismatch.');await run('INSERT INTO settings(id,value) VALUES(?,?)',id,value)}await audit(a,'workflow.updated',id);return output({ok:true});
 }

 if(key==='backup'&&method==='POST'){staff(a,['owner']);check(runtime().BACKUP_ENCRYPTION_KEY&&runtime().BUCKET,503,'Configure a separate backup encryption key and private storage first.');const snapshot=await captureBackup(db(),runtime().BUCKET,runtime().BACKUP_ENCRYPTION_KEY);await audit(a,'backup.exported','encrypted-snapshot');return output(snapshot,200,{'Content-Disposition':'attachment; filename=trip-bhai-encrypted-backup.json'});}

 if(key==='story-preview'&&method==='GET'){
  staff(a,['owner','content']);const d=await one("SELECT d.object_key,d.mime FROM success_stories s JOIN document_versions d ON d.id=s.document_id JOIN publication_permissions p ON p.id=s.permission_id WHERE s.id=? AND p.withdrawn_at IS NULL AND d.scan='clean'",action);check(d,404,'Review image unavailable.');const object=await runtime().BUCKET?.get(d.object_key);check(object,404,'Image unavailable.');return new Response(object.body,{headers:{'Content-Type':d.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'attachment; filename="trip-bhai-review-image.jpg"'}});
 }
 if(key==='staff'&&['reset-mfa','remove-grant','role'].includes(action)&&method==='POST'){
  staff(a,['owner']);const d=await body(request);
  if(action==='remove-grant'){const p=parse(z.object({grantId:id}),d);await run('DELETE FROM case_access WHERE id=?',p.grantId);await audit(a,'case.access-removed',p.grantId);return output({ok:true})}
  const p=parse(z.object({accountId:id,reason:z.string().trim().min(5).max(250),role:z.enum(['manager','caseworker','finance','content','client']).optional()}),d);check(p.accountId!==a.id,409,'Owner access cannot be changed here.');
  if(action==='reset-mfa')await db().batch([q('UPDATE accounts SET mfa_secret=NULL,last_totp=0,epoch=epoch+1 WHERE id=?',p.accountId),q('DELETE FROM staff_sessions WHERE account_id=?',p.accountId)]);
  else {check(p.role,400,'Select a role.');await db().batch([q('UPDATE accounts SET role=?,epoch=epoch+1 WHERE id=?',p.role,p.accountId),q('DELETE FROM staff_sessions WHERE account_id=?',p.accountId),q('DELETE FROM case_access WHERE account_id=?',p.accountId),q('UPDATE cases SET assignee=NULL,revision=revision+1 WHERE assignee=?',p.accountId)]);}
  await audit(a,'account.'+action,p.accountId,null,{reason:p.reason});return output({ok:true});
 }
 if(key==='privacy-review'){
  staff(a,['owner']);const d=parse(z.object({requestId:id,status:z.enum(['under review','completed','declined with explanation']),reason:z.string().trim().min(5).max(500)}),await body(request));const p=await one('SELECT * FROM privacy_requests WHERE id=?',d.requestId);check(p,404,'Request not found.');await run('UPDATE privacy_requests SET status=? WHERE id=?',d.status,p.id);await run('INSERT INTO notifications(id,account_id,label,created_at) VALUES(?,?,?,?)',uid(),p.account_id,'Privacy request: '+d.status+'. '+d.reason,now());await audit(a,'privacy.request-reviewed',p.id,null,{status:d.status});return output({ok:true});
 }
 if(key==='retention'&&method==='GET'){
  staff(a,['owner']);const setting=await one("SELECT value FROM settings WHERE id='retention'");const days=setting?JSON.parse(setting.value).days:365;return output(await many("SELECT c.id,c.reference,c.updated_at,c.status FROM cases c WHERE c.status IN('Closed','Completed','Cancelled') AND c.updated_at<? ORDER BY c.updated_at LIMIT 100",now()-days*86400000));
 }
 if(key==='delete-case'&&method==='POST'){
  staff(a,['owner']);const d=parse(z.object({caseId:id,revision,confirmed:z.literal(true),reason:z.string().trim().min(8).max(250)}),await body(request));const c=await one('SELECT * FROM cases WHERE id=?',d.caseId);check(c&&c.revision===d.revision,409,'Refresh and review the case first.');check(['Closed','Completed','Cancelled','Deletion in progress'].includes(c.status),409,'Close the case and review retention obligations first.');
  check(runtime().BUCKET,503,'Private storage must be connected before deletion.');
  const locked=await q("UPDATE cases SET status='Deletion in progress',revision=revision+1 WHERE id=? AND revision=? RETURNING revision",c.id,d.revision).first();check(locked,409,'Case changed. Refresh before deletion.');const files=await many('SELECT object_key FROM document_versions WHERE case_id=?',c.id);
  // Hide publications before deleting their objects. Repeat safely if storage deletion fails.
  await run("UPDATE success_stories SET status='withdrawn',revision=revision+1 WHERE case_id=?",c.id);
  for(const f of files)await runtime().BUCKET.delete(f.object_key);
  await db().batch([q('DELETE FROM payments WHERE quote_id IN(SELECT id FROM quotes WHERE case_id=?)',c.id),...['quotes','appointments','tasks','messages','document_versions','checklist_items','applicants','case_access','publication_permissions','success_stories','notifications'].map(table=>q(`DELETE FROM ${table} WHERE case_id=?`,c.id)),q('DELETE FROM cases WHERE id=? AND revision=?',c.id,locked.revision),auditStatementSafe(a,'case.deleted',c.id,{reason:d.reason})]);
  return output({ok:true,notice:'Case and current document objects removed. Account records and audit history remain; encrypted backups expire under the separate backup policy.'});
 }
 return null;
}
function auditStatementSafe(a:Actor,action:string,target:string,detail:any){return q('INSERT INTO audit_events(id,actor,action,target,detail,created_at) VALUES(?,?,?,?,?,?)',uid(),a.id,action,target,JSON.stringify(detail),now())}

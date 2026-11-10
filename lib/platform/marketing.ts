import {actor,check,one,many,run,staff,runtime,readBounded,hash,uid,now,output,body,audit} from './security';
import {scan,fileType} from './files';
import type {Actor} from './model';
export async function marketingAsset(request:Request,a:Actor|null,key:string){
 if(request.method==='GET'&&key&&key!=='list'){
  const file=await one("SELECT * FROM marketing_assets WHERE id=? AND approved=1 AND scan='clean'",key);check(file,404,'Image not published.');const object=await runtime().BUCKET?.get(file.object_key);check(object,404,'Image unavailable.');return new Response(object.body,{headers:{'Content-Type':file.mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }
 check(a,401,'Sign in first.');staff(a,['owner','content']);
 if(key==='list'&&request.method==='GET')return output(await many('SELECT id,mime,scan,approved,created_at FROM marketing_assets ORDER BY created_at DESC LIMIT 100'));
 if(key==='upload'&&request.method==='POST'){
  check(runtime().BUCKET&&runtime().DOCUMENT_SCANNER_TOKEN,503,'Private storage and approved scanning must be connected.');const bytes=await readBounded(request,4*1024*1024);const mime=fileType(bytes);check(mime.startsWith('image/'),415,'Only JPG and PNG marketing images are supported.');const digest=await hash(bytes.buffer as ArrayBuffer),id=uid(),objectKey='marketing/'+id;
  await run('INSERT INTO marketing_assets(id,object_key,mime,digest,scan,uploaded_by,created_at) VALUES(?,?,?,?,?,?,?)',id,objectKey,mime,digest,'quarantine',a.id,now());await runtime().BUCKET.put(objectKey,bytes);const verdict=await scan(bytes,digest);await run('UPDATE marketing_assets SET scan=? WHERE id=?',verdict,id);if(verdict!=='clean')await runtime().BUCKET.delete(objectKey);check(verdict==='clean',422,'This image did not pass scanning.');await audit(a,'marketing.image-uploaded',id);return output({id,url:'/api/platform/marketing-asset/'+id,notice:'Image is not public until approved.'},201);
 }
 if(key==='approve'&&request.method==='POST'){
  const d=await body(request);check(typeof d.id==='string'&&d.confirmed===true,400,'Confirm publication rights and that this is not a private client document.');const file=await one("SELECT id FROM marketing_assets WHERE id=? AND scan='clean'",d.id);check(file,404,'Scanned image not found.');await run('UPDATE marketing_assets SET approved=1 WHERE id=?',d.id);await audit(a,'marketing.image-published',d.id);return output({url:'/api/platform/marketing-asset/'+d.id});
 }
 return output({error:'Action unavailable.'},405);
}

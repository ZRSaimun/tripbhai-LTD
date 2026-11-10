import {workflows} from './model';
import {one} from './security';
export async function workflowFor(kind:string){const row=await one('SELECT value FROM settings WHERE id=?','workflow:'+kind);return row?JSON.parse(row.value).phases:workflows[kind]}

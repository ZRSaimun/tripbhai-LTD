import {readFile,mkdir,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync,readFileSync} from 'node:fs';
import {openBackup,restoreBackup} from '../lib/platform/backup.ts';
const [backupPath,target]=process.argv.slice(2);
if(!backupPath||!target||!process.env.TRIP_BACKUP_KEY)throw Error('Usage: TRIP_BACKUP_KEY=<separately stored key> node --experimental-strip-types scripts/restore-backup.mjs BACKUP.json NEW_TARGET_DIRECTORY');
try{await access(target);throw Error('Target already exists. Choose a new isolated restoration directory.')}catch(e){if(e.code!=='ENOENT')throw e}
const snapshot=await openBackup(JSON.parse(await readFile(backupPath,'utf8')),process.env.TRIP_BACKUP_KEY);
await mkdir(target,{recursive:true,mode:0o700});const database=new DatabaseSync(path.join(target,'restored.sqlite'));database.exec('PRAGMA foreign_keys=ON');
for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())database.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
const adapter={prepare(sql){const build=(values=[])=>({bind(...v){return build(v)},execute(){const statement=database.prepare(sql);return {results:statement.columns().length?statement.all(...values):(statement.run(...values),[])}},async first(){return this.execute().results[0]},async all(){return this.execute()}});return build()},async batch(queries){database.exec('BEGIN');try{const r=queries.map(q=>q.execute());database.exec('COMMIT');return r}catch(e){database.exec('ROLLBACK');throw e}}};
const result=await restoreBackup(snapshot,adapter,{async put(key,bytes){const filename=path.join(target,'objects',key);await mkdir(path.dirname(filename),{recursive:true,mode:0o700});await writeFile(filename,bytes,{mode:0o600})}});
database.close();console.log(JSON.stringify({restored:true,...result,note:'Isolated restore only. No production connection or publication was changed.'}));

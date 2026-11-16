import {readFile,writeFile,rename} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const wrangler=fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js',import.meta.url));
function runWrangler(args,{capture=false,cwd}={}){
  const result=spawnSync(process.execPath,[wrangler,...args],{
    cwd,encoding:'utf8',stdio:capture?['ignore','pipe','pipe']:'inherit',
    env:{...process.env,NO_COLOR:'1',WRANGLER_SEND_METRICS:'false'},
  });
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(capture?(result.stderr?.trim()||'Cloudflare konnte die vorhandenen Datenbanken nicht auflisten.'):`Wrangler ${args.join(' ')} ist fehlgeschlagen.`);
  return result.stdout??'';
}

export async function deployCloudflare({cwd=process.cwd(),run=runWrangler,log=console.log}={}){
  const configPath=path.join(cwd,'wrangler.json');
  const config=JSON.parse(await readFile(configPath,'utf8'));
  const bindings=config.d1_databases?.filter(binding=>binding.binding==='DB');
  if(bindings?.length!==1||!bindings[0].database_name)throw new Error('Genau eine D1-Bindung DB mit database_name wird benötigt.');
  const binding=bindings[0];
  let databases;
  try{databases=JSON.parse(await run(['d1','list','--json'],{capture:true,cwd}));}
  catch(error){throw new Error(`Die Datenbankzuordnung konnte nicht geprüft werden: ${error.message}`);}
  if(!Array.isArray(databases))throw new Error('Cloudflare lieferte keine gültige Datenbankliste.');
  const matches=databases.filter(database=>database.name===binding.database_name);
  if(matches.length!==1)throw new Error(`Die vorhandene D1-Datenbank "${binding.database_name}" wurde im aktuellen Cloudflare-Konto nicht eindeutig gefunden. Bitte den tatsächlichen Namen in database_name eintragen. Es wurde keine neue Datenbank erstellt.`);
  const database=matches[0];
  if(typeof database.uuid!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(database.uuid))throw new Error('Cloudflare lieferte keine gültige Datenbank-ID.');
  binding.database_id=database.uuid;
  // Resolve the ID in this authenticated build before either migrations or deploy.
  // Never create a replacement database or silently switch to a different name.
  const temporary=configPath+'.tmp';
  await writeFile(temporary,JSON.stringify(config,null,2)+'\n');
  await rename(temporary,configPath);
  log(`D1-Zuordnung geprüft: ${database.name} (${database.uuid}).`);
  await run(['d1','migrations','apply','DB','--remote'],{cwd});
  await run(['deploy'],{cwd});
  return{databaseId:database.uuid,databaseName:database.name};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{await deployCloudflare();}
  catch(error){console.error(error.message);process.exitCode=1;}
}

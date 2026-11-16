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
  if(!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(binding.database_name))throw new Error('Ungültiger D1-Datenbankname in database_name.');
  async function findDatabase(){
    let databases;
    try{databases=JSON.parse(await run(['d1','list','--json'],{capture:true,cwd}));}
    catch(error){throw new Error(`Die Datenbankzuordnung konnte nicht geprüft werden: ${error.message}`);}
    if(!Array.isArray(databases))throw new Error('Cloudflare lieferte keine gültige Datenbankliste.');
    return databases.filter(database=>database.name===binding.database_name);
  }
  let matches=await findDatabase();
  if(matches.length===0){
    log(`D1-Datenbank "${binding.database_name}" fehlt. Sie wird jetzt angelegt.`);
    let creationError;
    try{await run(['d1','create',binding.database_name,'--location','weur','--update-config=false'],{cwd});}
    catch(error){creationError=error;}
    // A concurrent deployment may have created the same name. Re-read the
    // account instead of parsing CLI text, replacing data or creating again.
    matches=await findDatabase();
    if(matches.length===0)throw new Error(creationError?`D1-Datenbank konnte nicht angelegt werden: ${creationError.message}`:'Die neu angelegte D1-Datenbank ist noch nicht sichtbar. Den Build erneut starten.');
  }
  if(matches.length!==1)throw new Error(`Die D1-Datenbank "${binding.database_name}" wurde nicht eindeutig gefunden. Vorhandene Datenbanken wurden nicht verändert.`);
  const database=matches[0];
  if(typeof database.uuid!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(database.uuid))throw new Error('Cloudflare lieferte keine gültige Datenbank-ID.');
  binding.database_id=database.uuid;
  // Resolve the ID in this authenticated build before either migrations or deploy.
  // Existing databases are reused; never replace data or switch to another name.
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

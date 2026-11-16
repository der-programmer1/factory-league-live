import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {deployCloudflare} from '../scripts/deploy-cloudflare.mjs';
const oldId='25ad31f7-5f5e-4d5f-9e04-000b2f5b2688';
const actualId='11111111-2222-4333-8444-555555555555';
async function fixture(){
  const cwd=await mkdtemp(path.join(tmpdir(),'factory-deploy-'));
  const config={name:'factory-league-live',compatibility_flags:['nodejs_compat'],secrets:{required:['PASSWORD_PEPPER']},d1_databases:[{binding:'DB',database_name:'factory-league',database_id:oldId,migrations_dir:'drizzle'}]};
  await writeFile(path.join(cwd,'wrangler.json'),JSON.stringify(config));
  return{cwd,config,read:async()=>JSON.parse(await readFile(path.join(cwd,'wrangler.json'),'utf8')),close:()=>rm(cwd,{recursive:true,force:true})};
}
test('resolve a stale database ID by exact name before migrations and deployment',async()=>{
  const f=await fixture(),calls=[];
  try{
    await deployCloudflare({cwd:f.cwd,log:()=>{},run:async args=>{
      calls.push(args);
      if(args[1]==='list')return JSON.stringify([{name:'another-project',uuid:oldId},{name:'factory-league',uuid:actualId}]);
      assert.equal((await f.read()).d1_databases[0].database_id,actualId);
      return '';
    }});
    assert.deepEqual(calls,[['d1','list','--json'],['d1','migrations','apply','DB','--remote'],['deploy']]);
    assert.deepEqual(await f.read(),{...f.config,d1_databases:[{...f.config.d1_databases[0],database_id:actualId}]});
  }finally{await f.close();}
});
test('a missing or ambiguous named database never creates or mutates a database',async()=>{
  for(const databases of [[],[{name:'other',uuid:actualId}],[{name:'factory-league',uuid:actualId},{name:'factory-league',uuid:oldId}]]){
    const f=await fixture(),calls=[];
    try{
      await assert.rejects(()=>deployCloudflare({cwd:f.cwd,log:()=>{},run:async args=>{calls.push(args);return JSON.stringify(databases);}}),/nicht eindeutig gefunden/);
      assert.deepEqual(calls,[['d1','list','--json']]);assert.deepEqual(await f.read(),f.config);
    }finally{await f.close();}
  }
});
test('authorization or malformed list responses stop before migrations',async()=>{
  for(const response of ['invalid-json','{}',JSON.stringify([{name:'factory-league',uuid:'not-an-id'}])]){
    const f=await fixture(),calls=[];
    try{
      await assert.rejects(()=>deployCloudflare({cwd:f.cwd,log:()=>{},run:async args=>{calls.push(args);return response;}}));
      assert.equal(calls.length,1);assert.deepEqual(await f.read(),f.config);
    }finally{await f.close();}
  }
  const f=await fixture();try{await assert.rejects(()=>deployCloudflare({cwd:f.cwd,run:async()=>{throw new Error('not authorized');}}),/not authorized/);assert.deepEqual(await f.read(),f.config);}finally{await f.close();}
});
test('a failed migration stops the Worker deploy',async()=>{
  const f=await fixture(),calls=[];
  try{
    await assert.rejects(()=>deployCloudflare({cwd:f.cwd,log:()=>{},run:async args=>{
      calls.push(args);if(args[1]==='list')return JSON.stringify([{name:'factory-league',uuid:actualId}]);throw new Error('migration failed');
    }}),/migration failed/);
    assert.equal(calls.length,2);assert.ok(!calls.some(args=>args[0]==='deploy'));
  }finally{await f.close();}
});

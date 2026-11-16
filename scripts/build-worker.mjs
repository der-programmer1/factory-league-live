import {build} from 'esbuild';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),client=path.join(root,'dist/client');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};
const assets={};
for(const file of await readdir(client,{recursive:true,withFileTypes:true})){if(!file.isFile())continue;const absolute=path.join(file.parentPath,file.name),relative=path.relative(client,absolute).split(path.sep).join('/');assets['/'+relative]={body:(await readFile(absolute)).toString('base64'),type:types[path.extname(file.name)]??'application/octet-stream'};}
await mkdir('.runtime',{recursive:true});await writeFile('.runtime/assets.json',JSON.stringify(assets));
await mkdir('dist/server',{recursive:true});
await build({entryPoints:['worker/index.ts'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'neutral',target:'es2022',minify:true,external:['node:*'],plugins:[{name:'embedded-static-assets',setup(b){b.onResolve({filter:/^virtual:static-assets$/},()=>({path:'assets',namespace:'embedded'}));b.onLoad({filter:/.*/,namespace:'embedded'},()=>({contents:JSON.stringify(assets),loader:'json'}));}}]});
console.log(`Cloudflare Worker built with ${Object.keys(assets).length} embedded assets. Deployment uses the repository wrangler.json.`);

// Compile reviewer source with a read-only, same-lock backend installation.
// Usage: node this.cjs <review-product-root> <dependency-backend-root>
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {spawnSync}=require('node:child_process');
const review=path.resolve(process.argv[2]),deps=path.resolve(process.argv[3]);
const backend=path.join(review,'backend/upstream/backend');
const digest=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if(digest(path.join(backend,'package-lock.json'))!==digest(path.join(deps,'package-lock.json')))throw Error('Dependency lock mismatch');
const output=path.join(review,'artifacts/qa/kan37-independent-compile');
const result=spawnSync(process.execPath,[path.join(deps,'node_modules/typescript/bin/tsc'),
  '-p',path.join(backend,'tsconfig.data.json'),'--baseUrl',path.join(deps,'node_modules'),
  '--typeRoots',path.join(deps,'node_modules/@types'),'--outDir',output,'--incremental','false','--noEmitOnError'],
  {cwd:review,stdio:'inherit',windowsHide:true});
if(result.error||result.status!==0)throw Error('Independent compilation failed');
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'package.json'),'{"type":"commonjs"}\n');
console.log('PASS: independent data compilation from reviewer source with matching locked dependency types.');

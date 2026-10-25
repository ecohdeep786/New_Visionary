// Independent compilation from the review checkout, using a read-only locked
// dependency installation. No implementation or dependency files are changed.
// Usage: node this-file.cjs <review-product-root> <dependency-backend-root>
const fs = require('node:fs');
const path = require('node:path');
const review = path.resolve(process.argv[2]);
const backend = path.join(review, 'backend/upstream/backend');
const dependencies = path.resolve(process.argv[3], 'node_modules');
const ts = require(path.join(dependencies, 'typescript'));
const configFile = path.join(backend, 'tsconfig.workspace.json');
const config = ts.readConfigFile(configFile, ts.sys.readFile);
if (config.error) throw Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, backend);
const output = path.resolve(review, 'artifacts/qa/kan36-independent-compile');
if (!output.startsWith(path.join(review, 'artifacts') + path.sep)) throw Error('Review output boundary mismatch');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'package.json'), '{"type":"commonjs"}\n');
const options = { ...parsed.options, outDir: output, incremental: false, declaration: false, sourceMap: false,
  noEmitOnError: true, baseUrl: backend, typeRoots: [path.join(dependencies, '@types')],
  paths: { ...parsed.options.paths, '*': [path.join(dependencies, '*').replaceAll('\\', '/')] } };
// A filesystem paths wildcard bypasses package subpath typesVersions lookup.
// Preserve Firebase's declared mappings when borrowing this read-only install.
const firebase = JSON.parse(fs.readFileSync(path.join(dependencies, 'firebase-admin/package.json'), 'utf8'));
for (const [subpath, targets] of Object.entries(firebase.typesVersions['*'])) {
  options.paths['firebase-admin/' + subpath] = targets.map((target) => path.join(dependencies, 'firebase-admin', target).replaceAll('\\', '/'));
}
const program = ts.createProgram(parsed.fileNames, options);
const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory: () => backend,
    getCanonicalFileName: (f) => f, getNewLine: () => '\n' }));
  process.exitCode = 1;
} else {
  const result = program.emit();
  if (result.emitSkipped) throw Error('Independent emit skipped');
  console.log('PASS: independent focused compilation from review source.');
  console.log(path.join(output, 'src/workspaces/workspace.repository.js'));
}

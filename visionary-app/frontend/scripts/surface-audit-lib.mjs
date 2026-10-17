import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import ts from 'typescript';

export const digest = text => createHash('sha256').update(text.replaceAll('\r\n', '\n')).digest('hex');
const normalize = p => p.replaceAll('\\', '/');
const walk = (node, visit) => { visit(node); ts.forEachChild(node, child => walk(child, visit)); };
const literal = node => node && (ts.isStringLiteralLike(node) ? node.text : ts.isJsxExpression(node) ? literal(node.expression) : undefined);
const opening = node => ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
const attr = (node, name) => node.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText() === name);
const parse = (file, text) => ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, /\.[jt]sx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const position = (sf, node) => { const p = sf.getLineAndCharacterOfPosition(node.getStart(sf)); return { line: p.line + 1, column: p.character + 1 }; };

export function typeValues(text, name) {
  const sf = parse('types.ts', text); let values;
  walk(sf, node => {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === name && ts.isUnionTypeNode(node.type)) values = node.type.types.map(t => ts.isLiteralTypeNode(t) ? literal(t.literal) : undefined);
  });
  if (!values?.length || values.some(v => v === undefined)) throw new Error(`Cannot resolve type dimension: ${name}`);
  return values;
}

export function inspectSource(file, text) {
  const sf = parse(file, text), imports = [], controls = [];
  if (sf.parseDiagnostics.length) throw new Error(`Cannot audit invalid syntax: ${file}`);
  walk(sf, node => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) imports.push(literal(node.moduleSpecifier));
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const target = literal(node.arguments[0]);
      if (!target) throw new Error(`Nonliteral dynamic import needs an explicit audit adapter: ${file}`);
      imports.push(target);
    }
    if (!ts.isJsxOpeningElement(node) && !ts.isJsxSelfClosingElement(node)) return;
    const tag = node.tagName.getText(sf), attributes = node.attributes.properties.filter(ts.isJsxAttribute);
    const events = attributes.filter(p => /^on[A-Z]/.test(p.name.getText(sf))).map(p => ({ event: p.name.getText(sf), expression: p.initializer?.getText(sf) || '' }));
    const role = literal(attr(node, 'role')?.initializer);
    const implicit = /^(button|a|input|select|textarea|form|summary)$/.test(tag) || /(Button|Trigger|Item|Input|Select|Slider|Switch|Checkbox|Textarea|RadioGroup|Toggle|Link|NavLink)$/.test(tag);
    const accessibleControl = /^(button|link|tab|menuitem|checkbox|switch|slider|combobox|textbox|radio)$/.test(role || '');
    if (!events.length && !implicit && !accessibleControl && !attr(node, 'contentEditable') && !(/^(audio|video)$/.test(tag) && attr(node, 'controls'))) return;
    const at = position(sf, node), destination = literal(attr(node, 'to')?.initializer) ?? literal(attr(node, 'href')?.initializer);
    const calls = new Set();
    for (const p of attributes.filter(p => /^on[A-Z]/.test(p.name.getText(sf)))) walk(p, child => { if (ts.isCallExpression(child)) calls.add(child.expression.getText(sf)); });
    controls.push({ id: `${file}:${at.line}:${at.column}`, file, ...at, tag, events, calls: [...calls].sort(),
      ...(destination !== undefined ? { destination } : {}), disabled: attr(node, 'disabled')?.getText(sf) ?? null,
      declarationSha256: digest(node.getText(sf)) });
  });
  return { file, sourceSha256: digest(text), imports: [...new Set(imports.filter(Boolean))].sort(), controls };
}

export function extractRoutes(text) {
  const sf = parse('App.jsx', text), imports = new Map(), routes = [];
  walk(sf, n => {
    if (ts.isVariableDeclaration(n) && n.initializer) walk(n.initializer, c => {
      if (ts.isCallExpression(c) && c.expression.kind === ts.SyntaxKind.ImportKeyword && literal(c.arguments[0])) imports.set(n.name.getText(sf), literal(c.arguments[0]));
    });
    if (ts.isImportDeclaration(n) && n.importClause?.name) imports.set(n.importClause.name.text, literal(n.moduleSpecifier));
  });
  const values = node => {
    const p = attr(node, 'path');
    if (!p) return [''];
    const value = literal(p.initializer); if (value !== undefined) return [value];
    const variable = p.initializer?.expression?.getText(sf);
    for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
      if (ts.isCallExpression(ancestor) && ts.isPropertyAccessExpression(ancestor.expression) && ancestor.expression.name.text === 'map' && ts.isArrayLiteralExpression(ancestor.expression.expression)) {
        const fn = ancestor.arguments[0];
        if (fn?.parameters?.[0]?.name.getText(sf) !== variable) continue;
        const items = ancestor.expression.expression.elements.map(literal);
        if (items.some(x => x === undefined)) break;
        return items;
      }
    }
    throw new Error(`Unsupported route expression requires explicit review: ${variable}`);
  };
  walk(sf, n => {
    if (!ts.isJsxOpeningElement(n) && !ts.isJsxSelfClosingElement(n) || n.tagName.getText(sf) !== 'Route') return;
    if (!attr(n, 'path') && !attr(n, 'index')) return;
    const expression = attr(n, 'element')?.initializer?.expression;
    const element = expression && opening(expression), component = element?.tagName.getText(sf);
    if (!component) throw new Error('Route element requires explicit review');
    const parentSegments = [];
    for (let a = n.parent; a; a = a.parent) if (ts.isJsxElement(a) && a.openingElement !== n && a.openingElement.tagName.getText(sf) === 'Route') {
      if (attr(a.openingElement, 'path')) parentSegments.unshift(values(a.openingElement)[0]);
    }
    for (const value of values(n)) {
      const full = value.startsWith('/') ? value : [...parentSegments, value].filter(Boolean).join('/');
      const route = full === '*' ? '*' : ('/' + full).replace(/\/+/g, '/').replace(/\/$/, '') || '/';
      const index = !!attr(n, 'index');
      routes.push({ id: `${route}${index ? '#index' : ''}`, path: route, index, component,
        componentImport: imports.get(component) ?? null, redirect: component === 'Navigate' ? literal(attr(element, 'to')?.initializer) : null,
        environment: component === 'DemoPreview' ? 'development-only' : 'production-source', ...position(sf, n) });
    }
  });
  if (new Set(routes.map(r => r.id)).size !== routes.length) throw new Error('Duplicate route identity');
  return routes;
}

export function inspectControllers(moduleText, read) {
  const module = parse('module.ts', moduleText), imports = new Map(); let names;
  walk(module, node => {
    if (ts.isImportDeclaration(node) && node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) for (const n of node.importClause.namedBindings.elements) imports.set(n.name.text, literal(node.moduleSpecifier));
    if (ts.isPropertyAssignment(node) && node.name.getText(module) === 'controllers' && ts.isArrayLiteralExpression(node.initializer)) names = node.initializer.elements.map(e => e.getText(module));
  });
  if (!names?.length) throw new Error('Selected controller graph cannot be resolved');
  const endpoints = [];
  for (const name of names) {
    if (!imports.has(name)) throw new Error(`Unresolved controller: ${name}`);
    const { file, text } = read(imports.get(name)), sf = parse(file, text);
    const decorators = node => ts.canHaveDecorators(node) ? ts.getDecorators(node) || [] : [];
    const args = decorator => ts.isCallExpression(decorator.expression) ? decorator.expression : null;
    walk(sf, node => {
      if (!ts.isClassDeclaration(node) || node.name?.text !== name) return;
      const prefix = decorators(node).map(args).find(d => d?.expression.getText(sf) === 'Controller');
      if (!prefix || literal(prefix.arguments[0]) === undefined) throw new Error(`Unresolved controller prefix: ${name}`);
      for (const method of node.members.filter(ts.isMethodDeclaration)) for (const d of decorators(method).map(args).filter(Boolean)) {
        const verb = d.expression.getText(sf).toUpperCase(); if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(verb)) continue;
        const segment = d.arguments.length ? literal(d.arguments[0]) : '';
        if (segment === undefined) throw new Error(`Unresolved endpoint: ${name}`);
        endpoints.push({ method: verb, path: ['/api', literal(prefix.arguments[0]), segment].filter(Boolean).join('/'), controller: name, handler: method.name.getText(sf), file, ...position(sf, method) });
      }
    });
  }
  return endpoints.sort((a, b) => `${a.path} ${a.method}`.localeCompare(`${b.path} ${b.method}`));
}

export function collectSurface(root) {
  const files = new Map();
  const visit = dir => { for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = normalize(path.join(dir, entry.name));
    if (entry.isDirectory()) visit(file); else if (/\.[jt]sx?$/.test(file) && !file.endsWith('.d.ts')) files.set(file, inspectSource(file, fs.readFileSync(path.join(root, file), 'utf8')));
  } };
  visit('frontend/src');
  const resolve = (from, specifier) => {
    if (!specifier.startsWith('.') && !specifier.startsWith('@/')) return null;
    const base = normalize(specifier.startsWith('@/') ? 'frontend/src/' + specifier.slice(2) : path.posix.join(path.posix.dirname(from), specifier));
    const target = [base, ...['.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx', '/index.ts'].map(ext => base + ext)].find(p => files.has(p));
    if (!target && !/\.(css|json|svg|png|jpe?g|webp|gif|woff2?|mp4)$/.test(base)) throw new Error(`Unresolved local source import ${from} → ${specifier}`);
    return target ?? null;
  };
  const closure = seeds => {
    const found = new Set(), pending = [...seeds];
    while (pending.length) { const file = pending.pop(); if (!file || found.has(file)) continue; found.add(file); for (const imp of files.get(file)?.imports || []) { const target = resolve(file, imp); if (target) pending.push(target); } }
    return [...found].sort();
  };
  const routes = extractRoutes(fs.readFileSync(path.join(root, 'frontend/src/App.jsx'), 'utf8'));
  const wrappers = { LandingEntry: ['frontend/src/pages/Landing.jsx'], ClassesEntry: ['frontend/src/pages/dashboard/StudentClasses.jsx', 'frontend/src/pages/dashboard/role/TeacherHome.jsx'], PageNotFound: ['frontend/src/lib/PageNotFound.jsx'] };
  for (const route of routes) {
    const seeds = route.componentImport ? [resolve('frontend/src/App.jsx', route.componentImport)] : wrappers[route.component] || [];
    if (!seeds.length && route.component !== 'Navigate') throw new Error(`Unresolved route entry ${route.component}`);
    if (route.path.startsWith('/dashboard')) seeds.push('frontend/src/components/dashboard/DashboardLayout.jsx');
    route.sourceFiles = closure(seeds);
  }
  const modulePath = 'backend/upstream/backend/src/auth/firebase-product/firebase-product.module.ts';
  const endpoints = inspectControllers(fs.readFileSync(path.join(root, modulePath), 'utf8'), specifier => {
    const file = normalize(path.posix.join(path.posix.dirname(modulePath), specifier + '.ts'));
    return { file, text: fs.readFileSync(path.join(root, file), 'utf8') };
  });
  const controls = [...files.values()].flatMap(f => f.controls).map(c => ({ ...c, routeIds: routes.filter(r => r.sourceFiles.includes(c.file) || c.file === 'frontend/src/App.jsx').map(r => r.id) }));
  const entrypoint = 'backend/upstream/backend/src/main-auth.ts';
  if (!/NestFactory\.create\(FirebaseProductModule/.test(fs.readFileSync(path.join(root, entrypoint), 'utf8'))) throw new Error('Selected backend entrypoint changed; review the audit adapter.');
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const backendFiles = [...new Set([entrypoint, modulePath, ...endpoints.map(e => e.file)])].sort();
  const dimensions = { roles: typeValues(read('frontend/src/domain/workspace.ts'), 'Role'),
    interfaceLocales: typeValues(read('frontend/src/domain/workspace.ts'), 'Locale'),
    presentationStages: typeValues(read('frontend/src/services/stagePresentation.ts'), 'LearningStage') };
  const languageConfig = parse('languages.jsx', read('frontend/src/components/onboarding/stepConfigs.jsx'));
  walk(languageConfig, n => {
    if (!ts.isVariableDeclaration(n) || n.name.getText(languageConfig) !== 'LANGUAGES') return;
    const init = n.initializer;
    const values = init && ts.isArrayLiteralExpression(init) ? init : init && ts.isCallExpression(init) && ts.isPropertyAccessExpression(init.expression) && init.expression.name.text === 'map' ? init.expression.expression : null;
    if (values && ts.isArrayLiteralExpression(values)) dimensions.onboardingLanguageChoices = values.elements.map(literal);
  });
  if (!dimensions.onboardingLanguageChoices?.length || dimensions.onboardingLanguageChoices.some(x => x === undefined)) throw new Error('Onboarding language choices need review');
  return { schemaVersion: 1, task: 'KAN-28 / SCOPE-01', evidence: 'source declarations; no hosted execution claim', routes, endpoints, controls,
    dimensions, sources: [...files.values()].map(({ file, sourceSha256 }) => ({ file, sourceSha256 })),
    backendSources: backendFiles.map(file => ({ file, sourceSha256: digest(read(file)) })) };
}

export function verifyCoverage(surface, review) {
  const states = ['connected', 'preview', 'missing', 'intentionally-unreleased'];
  const knownFiles = new Set(surface.controls.map(c => c.file));
  for (const file of knownFiles) if (!review.files[file]) throw new Error(`Unreviewed control file: ${file}`);
  for (const file of Object.keys(review.files)) if (!knownFiles.has(file)) throw new Error(`Obsolete control review: ${file}`);
  for (const [file, record] of Object.entries(review.files)) {
    if (!states.includes(record.state) || !record.reason || !record.followUp?.length) throw new Error(`Invalid control review: ${file}`);
    if (record.state === 'connected' && record.execution === 'server' && !record.endpoints?.length) throw new Error(`Server connection lacks endpoint evidence: ${file}`);
    for (const endpoint of record.endpoints || []) if (!surface.endpoints.some(e => `${e.method} ${e.path}` === endpoint)) throw new Error(`Endpoint is not in the selected runtime: ${endpoint}`);
    if (record.execution === 'not-route-reachable' && surface.controls.some(c => c.file === file && c.routeIds?.length)) throw new Error(`Previously retained source is now reachable; review ${file}`);
    if (record.execution === 'development-only' && surface.routes.some(r => r.environment !== 'development-only' && r.sourceFiles?.includes(file))) throw new Error(`Development source is now production-reachable; review ${file}`);
  }
  const roles = ['student', 'teacher', 'parent', 'professional', 'organization'];
  if (!review.roles || review.roles.length !== roles.length || roles.some(r => !review.roles.includes(r)) || !review.categories?.length || !review.interfaceLocales?.length) throw new Error('Missing role/category/locale dimensions');
  for (const operation of review.operations || []) {
    if (!states.includes(operation.state) || !operation.reason || !operation.followUp?.length) throw new Error(`Invalid operation: ${operation.id}`);
    if (operation.state === 'connected' && operation.execution === 'server' && !operation.endpoints?.length) throw new Error(`Server operation lacks endpoint evidence: ${operation.id}`);
    for (const route of operation.routes) if (!surface.routes.some(r => r.path === route)) throw new Error(`Unknown operation route: ${route}`);
    for (const endpoint of operation.endpoints || []) if (!surface.endpoints.some(e => `${e.method} ${e.path}` === endpoint)) throw new Error(`Unregistered operation endpoint: ${endpoint}`);
  }
  return true;
}

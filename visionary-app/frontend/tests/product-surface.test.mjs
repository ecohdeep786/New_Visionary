import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractRoutes, inspectSource, inspectControllers, verifyCoverage } from '../scripts/surface-audit-lib.mjs';
import { auditProduct } from '../scripts/product-surface.mjs';

test('JSX control inventory sees implicit, accessible and callback controls without counting comments', () => {
  const source = `// <button onClick={phantom}/>
  const View=()=> <><button onClick={save}/><a href='/next'>Next</a>
  <summary>Details</summary><Menu.Trigger/><Menu.Item/><div role="button"/>
  <Choice onValueChange={value=>save(value)}/><input {...props}/><div>Text</div></>;`;
  const scan = inspectSource('fixture.jsx', source);
  assert.equal(scan.controls.length, 8);
  assert.deepEqual(scan.controls[0].events, [{ event: 'onClick', expression: '{save}' }]);
  assert.equal(scan.controls[1].destination, '/next');
  assert.deepEqual(scan.controls[6].calls, ['save']);
  assert.equal(scan.sourceSha256, inspectSource('fixture.jsx', source.replaceAll('\n', '\r\n')).sourceSha256);
  assert.deepEqual(scan.controls, inspectSource('fixture.jsx', source.replaceAll('\n', '\r\n')).controls);
});

test('nested, mapped, index, redirect and dev-only routes retain distinct identities', () => {
  const routes = extractRoutes(`const DemoPreview=import.meta.env.DEV?lazy(()=>import('@/pages/DemoPreview')):null;
  const App=()=> <Routes>{DemoPreview&&<Route path='/dev/scenarios' element={<DemoPreview/>}/>}
  <Route path='/signin' element={<Navigate to='/login'/>}/><Route path='/dashboard' element={<Layout/>}>
  <Route index element={<Home/>}/>{['learn','build'].map(area=><Route path={area} element={<Tools/>}/>)}
  </Route><Route path='*' element={<Missing/>}/></Routes>;`);
  assert.deepEqual(routes.map(r => r.id), ['/dev/scenarios', '/signin', '/dashboard', '/dashboard#index', '/dashboard/learn', '/dashboard/build', '*']);
  assert.equal(routes[0].componentImport, '@/pages/DemoPreview');
  assert.equal(routes[0].environment, 'development-only');
  assert.equal(routes[1].redirect, '/login');
  assert.throws(() => extractRoutes(`const A=()=> <Route path={arbitrary()} element={<Page/>}/>;`), /explicit review/);
});

test('registered endpoint inventory follows only the selected controller list', () => {
  const module = `import {Current} from './current'; import {Legacy} from './legacy';
  @Module({controllers:[Current]}) class Product {}`;
  const requested = [];
  const endpoints = inspectControllers(module, specifier => {
    requested.push(specifier);
    return { file: 'current.ts', text: `@Controller('account') class Current {
      @Get('overview') overview(){} @Post() save(){} @Delete('items/:id') remove(){}}
      @Controller('legacy') class Legacy {@Get('private') all(){}}` };
  });
  assert.deepEqual(requested, ['./current']);
  assert.deepEqual(endpoints.map(e => e.method + ' ' + e.path), ['POST /api/account', 'DELETE /api/account/items/:id', 'GET /api/account/overview']);
  assert.throws(() => inspectControllers('@Module({controllers:[Unknown]}) class M {}', () => {}), /Unresolved controller/);
});

test('unreviewed controls, fabricated server endpoints and incomplete role coverage fail closed', () => {
  const surface = { controls: [{ file: 'screen.jsx' }], routes: [{ path: '/screen' }], endpoints: [{ method: 'POST', path: '/api/current' }] };
  const record = { state: 'preview', reason: 'Local only', followUp: ['DATA-01'] };
  const review = { files: { 'screen.jsx': record }, roles: ['student', 'teacher', 'parent', 'professional', 'organization'], categories: ['primary'], interfaceLocales: ['en'], operations: [] };
  assert.equal(verifyCoverage(surface, review), true);
  assert.throws(() => verifyCoverage({ ...surface, controls: [...surface.controls, { file: 'new.jsx' }] }, review), /Unreviewed control/);
  assert.throws(() => verifyCoverage(surface, { ...review, files: { 'screen.jsx': { ...record, state: 'connected', execution: 'server' } } }), /lacks endpoint/);
  assert.throws(() => verifyCoverage(surface, { ...review, files: { 'screen.jsx': { ...record, endpoints: ['POST /api/legacy'] } } }), /selected runtime/);
  assert.throws(() => verifyCoverage(surface, { ...review, roles: ['student', 'teacher', 'parent', 'professional', 'admin'] }), /dimensions/);
  assert.throws(() => verifyCoverage({ ...surface, routes: [{ path: '/screen', environment: 'production-source', sourceFiles: ['screen.jsx'] }] },
    { ...review, files: { 'screen.jsx': { ...record, state: 'intentionally-unreleased', execution: 'development-only' } } }), /production-reachable/);
});

test('the checked inventory includes every current declaration without granting production or role authority', () => {
  const surface = auditProduct();
  const saved = JSON.parse(fs.readFileSync(new URL('../../docs/architecture/tracking/product-surface.json', import.meta.url), 'utf8'));
  assert.deepEqual(surface, saved, 'Source changed: review the scope and refresh the inventory');
  assert.ok(surface.controls.some(c => !c.routeIds.length && c.state === 'intentionally-unreleased'));
  assert.ok(surface.controls.filter(c => c.file.endsWith('/DemoPreview.jsx')).every(c => c.state === 'intentionally-unreleased'));
  assert.ok(surface.controls.every(c => c.hostedVerified === false && c.classificationReason && c.followUp.length));
  const classRoute = surface.routes.find(r => r.path === '/dashboard/class/:classId');
  assert.ok(classRoute.roles.includes('teacher'));
  assert.ok(!classRoute.roles.includes('parent') && !classRoute.roles.includes('organization'));
  assert.match(classRoute.authority, /server-owned/);
  assert.equal(surface.review.categories.length, 9);
  assert.deepEqual(surface.review.interfaceLocales, ['en', 'hi', 'bn']);
  assert.ok(surface.review.operations.some(o => o.id === 'ask-guide-model-turn' && o.state === 'missing'));
  assert.ok(surface.review.operations.some(o => o.id === 'account-records-ui-binding' && o.state === 'missing'));
  assert.ok(surface.endpoints.every(e => !/learn|model|project|classroom/.test(e.path)));
});

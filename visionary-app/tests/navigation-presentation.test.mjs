import test from 'node:test';
import assert from 'node:assert/strict';
import {presentNavigation} from '../src/lib/navigationPresentation.js';
import {needsAssetReload} from '../src/lib/assetRecovery.js';

const primary=['home','learn','ask','practice','build'].map(key=>({key,to:`/dashboard/${key}`}));
const secondary=['classes','progress','privacy'].map(key=>({key,to:`/dashboard/${key}`}));
test('emerging-reader navigation keeps every route reachable without mutating the role list',()=>{
  const before=structuredClone({primary,secondary});
  const result=presentNavigation('student','foundational',primary,secondary);
  assert.deepEqual(result.primary.map(item=>item.key),['home','learn','ask']);
  assert.deepEqual(result.secondary.map(item=>item.key),['practice','build','classes','progress','privacy']);
  assert.deepEqual({primary,secondary},before);
  assert.equal(new Set([...result.primary,...result.secondary].map(item=>item.to)).size,8);
});
test('the full role navigation remains for other stages and roles',()=>{
  for(const role of ['student','teacher','parent','professional','organization'])for(const tier of ['higher','secondary','developing',...(role==='student'?[]:['foundational'])]){
    const result=presentNavigation(role,tier,primary,secondary);
    assert.deepEqual(result.primary,primary);assert.deepEqual(result.secondary,secondary);
  }
});
test('More identifies a secondary destination without highlighting an unknown route',()=>{
  for(const tier of ['higher','foundational']){
    assert.equal(presentNavigation('student',tier,primary,secondary,'/dashboard/build').mobileMoreActive,true);
    assert.equal(presentNavigation('student',tier,primary,secondary,'/dashboard/privacy').mobileMoreActive,true);
    assert.equal(presentNavigation('student',tier,primary,secondary,'/dashboard/home').mobileMoreActive,false);
    assert.equal(presentNavigation('student',tier,primary,secondary,'/dashboard/unknown').mobileMoreActive,false);
  }
});
test('stale CSS or lazy import failures need a document reload; ordinary failures keep normal recovery',()=>{
  for(const message of ['Unable to preload CSS for /assets/old.css','Failed to fetch dynamically imported module: /assets/old.js','Importing a module script failed.','Loading chunk 19 failed.'])assert.equal(needsAssetReload(Error(message)),true);
  for(const error of [undefined,Error('Storage quota exceeded'),Error('Permission required'),Error('Network request failed')])assert.equal(needsAssetReload(error),false);
});

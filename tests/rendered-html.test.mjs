import assert from 'node:assert/strict';
import test from 'node:test';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){if(specifier==='cloudflare:workers')return {url:'data:text/javascript,export const env={}',shortCircuit:true};return next(specifier,context)}});
const {default:worker}=await import('../dist/server/index.js');
const runtime={ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},context={waitUntil(){},passThroughOnException(){}};
test('built public pages render real branding, accessible content and no private visa assets',async()=>{for(const path of ['/','/contact','/visa-services','/our-team']){const r=await worker.fetch(new Request('http://localhost'+path,{headers:{accept:'text/html'}}),runtime,context);assert.equal(r.status,200);const html=await r.text();assert.match(html,/<title>[^<]*Trip Bhai/);assert.ok(!html.includes('/images/visa-'));assert.ok(!html.includes('Beyond'));}});
test('private workspace pages are noindex and private APIs require identity',async()=>{for(const path of ['/portal','/staff']){const r=await worker.fetch(new Request('http://localhost'+path),runtime,context);assert.equal(r.status,200);assert.match(await r.text(),/noindex/)}const r=await worker.fetch(new Request('http://localhost/api/platform/cases'),runtime,context);assert.equal(r.status,401)});

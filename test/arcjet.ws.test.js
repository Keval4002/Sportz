import test from 'node:test'
import assert from 'node:assert/strict'

process.env.ARCJET_KEY = process.env.ARCJET_KEY ?? 'test_key'
process.env.ARCJET_MODE = 'DRY_RUN'

const { wsArcjet } = await import('../src/arcjet/arcjet.js')

test('WS Arcjet protect is callable and returns decision', async ()=>{
  if(!wsArcjet) throw new Error('wsArcjet not initialized')
  const fakeReq = { headers: {}, socket: { remoteAddress: '127.0.0.1' }, url: '/ws' }
  const decision = await wsArcjet.protect(fakeReq)
  assert.equal(typeof decision.isDenied, 'function')
})

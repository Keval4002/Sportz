import test from 'node:test'
import assert from 'node:assert/strict'

process.env.ARCJET_KEY = process.env.ARCJET_KEY ?? 'test_key'
process.env.ARCJET_MODE = 'DRY_RUN'

const { httpArcjet } = await import('../src/arcjet/arcjet.js')

test('HTTP Arcjet protect is callable and returns decision', async ()=>{
  if(!httpArcjet) throw new Error('httpArcjet not initialized')
  const fakeReq = { headers: {}, method: 'GET', url: '/', socket: { remoteAddress: '127.0.0.1' } }
  const decision = await httpArcjet.protect(fakeReq)
  assert.equal(typeof decision.isDenied, 'function')
})

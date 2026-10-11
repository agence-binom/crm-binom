import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import test from 'node:test'
import { BodyTooLargeError, readLimitedBody } from '../server/lib/limited-body'

const chunked = (...chunks: string[]) => Readable.from(chunks.map(chunk => Buffer.from(chunk)))

test('readLimitedBody renvoie le corps complet sous la limite', async () => {
  const body = await readLimitedBody(chunked('{"a":', '1}'), 64)
  assert.equal(body.toString('utf8'), '{"a":1}')
})

test('readLimitedBody accepte un corps exactement à la limite', async () => {
  const body = await readLimitedBody(chunked('12345', '67890'), 10)
  assert.equal(body.byteLength, 10)
})

test('readLimitedBody refuse un corps envoyé par morceaux dès qu’il dépasse la limite', async () => {
  // Sans Content-Length (requête chunked), seul ce comptage protège du dépassement.
  const stream = chunked('a'.repeat(100), 'b'.repeat(100), 'c'.repeat(100))
  await assert.rejects(readLimitedBody(stream, 150), BodyTooLargeError)
})

test('readLimitedBody compte des octets, pas des caractères', async () => {
  await assert.rejects(readLimitedBody(chunked('é'.repeat(6)), 10), BodyTooLargeError)
})

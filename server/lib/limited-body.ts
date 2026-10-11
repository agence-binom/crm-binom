import type { Readable } from 'node:stream'

export class BodyTooLargeError extends Error {
  constructor(readonly maxBytes: number) {
    super(`Corps de requête supérieur à ${maxBytes} octets`)
  }
}

// Content-Length ne suffit pas : une requête chunked n'en a pas, et h3 lirait alors le corps entier
// en mémoire avant toute validation. On compte les octets au fil de la lecture et on s'arrête dès le
// dépassement. Le reste du flux est vidé (resume) plutôt que coupé, pour que la réponse 413 parvienne
// encore au client au lieu d'une connexion réinitialisée.
export const readLimitedBody = (stream: Readable, maxBytes: number) => new Promise<Buffer>((resolve, reject) => {
  const chunks: Buffer[] = []
  let size = 0

  const onData = (chunk: Buffer | string) => {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk
    size += buffer.byteLength
    if (size > maxBytes) {
      stream.off('data', onData)
      stream.off('end', onEnd)
      stream.resume()
      reject(new BodyTooLargeError(maxBytes))
      return
    }
    chunks.push(buffer)
  }
  const onEnd = () => resolve(Buffer.concat(chunks))

  stream.on('data', onData)
  stream.once('end', onEnd)
  stream.once('error', reject)
})

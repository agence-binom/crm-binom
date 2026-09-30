import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import { classifyProjectNoteSaveError, createProjectNoteAutosave, type ProjectNoteChanges, type ProjectNoteSaveErrorKind, type ProjectNoteSaveStatus } from '../app/lib/project-note-autosave'

type SaveCall = ProjectNoteChanges & { updatedAt: string }
type Deferred = { resolve: (value: { updatedAt: string }) => void, reject: (error: unknown) => void }

const doc = (text: string) => ({ type: 'doc' as const, content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })

// setImmediate n'est pas simulé par mock.timers : il laisse les promesses en cours se résoudre.
const settle = () => new Promise(resolve => setImmediate(resolve))

const createHarness = (options: { autoResolve?: boolean, classify?: ProjectNoteSaveErrorKind } = {}) => {
  const calls: SaveCall[] = []
  const deferreds: Deferred[] = []
  const statuses: ProjectNoteSaveStatus[] = []
  let version = 0

  const autosave = createProjectNoteAutosave({
    updatedAt: 'v0',
    save: (payload) => {
      calls.push(payload)
      if (options.autoResolve !== false) {
        version += 1
        return Promise.resolve({ updatedAt: `v${version}` })
      }
      return new Promise((resolve, reject) => deferreds.push({ resolve, reject }))
    },
    classifyError: () => options.classify ?? 'retry',
    onStatusChange: status => statuses.push(status),
    retryDelaysMs: [1_000, 5_000]
  })

  return { autosave, calls, deferreds, statuses }
}

test.beforeEach(() => mock.timers.enable({ apis: ['setTimeout'] }))
test.afterEach(() => mock.timers.reset())

test('regroupe une frappe rapide en un seul enregistrement, avec la dernière valeur', async () => {
  const { autosave, calls } = createHarness()

  autosave.update({ content: doc('B') })
  mock.timers.tick(500)
  autosave.update({ content: doc('Bo') })
  mock.timers.tick(500)
  autosave.update({ content: doc('Bon') })
  assert.equal(calls.length, 0)

  mock.timers.tick(800)
  await settle()

  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], { content: doc('Bon'), updatedAt: 'v0' })
  assert.equal(autosave.getStatus(), 'saved')
})

test('une fermeture immédiate après la frappe enregistre tout sans attendre le délai', async () => {
  const { autosave, calls } = createHarness()

  autosave.update({ title: 'Kick-off' })
  autosave.update({ content: doc('Dernier mot tapé') })

  assert.equal(await autosave.flush(), true)
  assert.deepEqual(calls, [{ title: 'Kick-off', content: doc('Dernier mot tapé'), updatedAt: 'v0' }])

  mock.timers.tick(800)
  await settle()
  assert.equal(calls.length, 1)
})

test('la saisie faite pendant un enregistrement part ensuite, avec le nouvel updatedAt', async () => {
  const { autosave, calls, deferreds } = createHarness({ autoResolve: false })

  autosave.update({ content: doc('Premier jet') })
  const firstFlush = autosave.flush()
  assert.equal(calls.length, 1)

  autosave.update({ content: doc('Premier jet, complété') })
  const closing = autosave.flush()

  deferreds[0]!.resolve({ updatedAt: 'v1' })
  await settle()
  assert.equal(calls.length, 2)
  assert.deepEqual(calls[1], { content: doc('Premier jet, complété'), updatedAt: 'v1' })

  deferreds[1]!.resolve({ updatedAt: 'v2' })
  assert.equal(await firstFlush, true)
  assert.equal(await closing, true)
  assert.equal(autosave.hasUnsavedChanges(), false)
})

test('un échec réseau remet les modifications en file et réessaie après un délai', async () => {
  const { autosave, calls, deferreds } = createHarness({ autoResolve: false })

  autosave.update({ title: 'Titre', content: doc('Avant la panne') })
  const flushed = autosave.flush()
  deferreds[0]!.reject(new Error('network'))

  assert.equal(await flushed, false)
  assert.equal(autosave.getStatus(), 'retrying')
  assert.equal(autosave.hasUnsavedChanges(), true)

  // Pendant la panne, la frappe s'accumule sans déclencher d'envoi supplémentaire.
  autosave.update({ content: doc('Pendant la panne') })
  mock.timers.tick(800)
  await settle()
  assert.equal(calls.length, 1)

  mock.timers.tick(200)
  await settle()
  assert.equal(calls.length, 2)
  assert.deepEqual(calls[1], { title: 'Titre', content: doc('Pendant la panne'), updatedAt: 'v0' })

  deferreds[1]!.resolve({ updatedAt: 'v1' })
  await settle()
  assert.equal(autosave.getStatus(), 'saved')
})

test('une modification faite pendant un envoi en échec prime sur celle remise en file', async () => {
  const { autosave, calls, deferreds } = createHarness({ autoResolve: false })

  autosave.update({ content: doc('Ancienne') })
  const flushed = autosave.flush()
  autosave.update({ content: doc('Nouvelle') })
  deferreds[0]!.reject(new Error('network'))
  await flushed

  const retry = autosave.flush()
  deferreds[1]!.resolve({ updatedAt: 'v1' })
  assert.equal(await retry, true)
  assert.deepEqual(calls[1]?.content, doc('Nouvelle'))
})

test('en conflit, recharger la version serveur abandonne la saisie locale', async () => {
  const { autosave, calls, deferreds } = createHarness({ autoResolve: false, classify: 'conflict' })

  autosave.update({ content: doc('Ma version') })
  const flushed = autosave.flush()
  deferreds[0]!.reject(new Error('409'))
  assert.equal(await flushed, false)
  assert.equal(autosave.getStatus(), 'conflict')

  autosave.update({ content: doc('Ma version, suite') })
  mock.timers.tick(5_000)
  await settle()
  assert.equal(calls.length, 1)
  assert.equal(await autosave.flush(), false)

  autosave.discardLocalChanges('v-serveur')
  assert.equal(autosave.getStatus(), 'saved')
  assert.equal(autosave.hasUnsavedChanges(), false)
  assert.equal(await autosave.flush(), true)
  assert.equal(calls.length, 1)
})

test('en conflit, garder sa version envoie l\'état complet avec l\'updatedAt du serveur', async () => {
  const { autosave, calls, deferreds } = createHarness({ autoResolve: false, classify: 'conflict' })

  autosave.update({ content: doc('Ma version') })
  const flushed = autosave.flush()
  deferreds[0]!.reject(new Error('409'))
  await flushed

  const overwritten = autosave.overwriteWith('v-serveur', { title: 'Mon titre', content: doc('Ma version') })
  deferreds[1]!.resolve({ updatedAt: 'v2' })

  assert.equal(await overwritten, true)
  assert.deepEqual(calls[1], { title: 'Mon titre', content: doc('Ma version'), updatedAt: 'v-serveur' })
})

test('une erreur définitive (4xx) n\'est pas retentée automatiquement, mais l\'est à la demande', async () => {
  const { autosave, calls, deferreds } = createHarness({ autoResolve: false, classify: 'fail' })

  autosave.update({ title: 'Titre' })
  const flushed = autosave.flush()
  deferreds[0]!.reject(new Error('400'))
  assert.equal(await flushed, false)
  assert.equal(autosave.getStatus(), 'failed')

  mock.timers.tick(60_000)
  await settle()
  assert.equal(calls.length, 1)

  const retry = autosave.flush()
  deferreds[1]!.resolve({ updatedAt: 'v1' })
  assert.equal(await retry, true)
})

test('classifyProjectNoteSaveError distingue conflit, erreur définitive et erreur passagère', () => {
  assert.equal(classifyProjectNoteSaveError({ statusCode: 409 }), 'conflict')
  assert.equal(classifyProjectNoteSaveError({ statusCode: 400 }), 'fail')
  assert.equal(classifyProjectNoteSaveError({ statusCode: 404 }), 'fail')
  assert.equal(classifyProjectNoteSaveError({ statusCode: 413 }), 'fail')
  assert.equal(classifyProjectNoteSaveError({ statusCode: 429 }), 'retry')
  assert.equal(classifyProjectNoteSaveError({ statusCode: 503 }), 'retry')
  assert.equal(classifyProjectNoteSaveError(new TypeError('Failed to fetch')), 'retry')
})

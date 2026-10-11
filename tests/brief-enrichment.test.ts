import assert from 'node:assert/strict'
import test from 'node:test'
import {
  detectEmailProvider,
  detectHosting,
  detectTechnologies,
  isPrivateIp,
  parseRdapRegistrar
} from '../server/lib/brief-enrichment'

test('detectEmailProvider reconnaît les principaux services à partir des MX', () => {
  assert.equal(detectEmailProvider(['aspmx.l.google.com', 'alt1.aspmx.l.google.com']), 'Google Workspace')
  assert.equal(detectEmailProvider(['exemple-fr.mail.protection.outlook.com']), 'Microsoft 365')
  assert.equal(detectEmailProvider(['mx1.mail.ovh.net.']), 'OVHcloud')
  assert.equal(detectEmailProvider(['mx00.ionos.fr']), 'IONOS')
  assert.equal(detectEmailProvider(['mail.exemple.fr']), null)
  assert.equal(detectEmailProvider([]), null)
})

test('detectHosting privilégie la plateforme, puis le reverse DNS, puis Cloudflare', () => {
  assert.equal(detectHosting({ headers: { 'x-shopid': '123' }, reverseDns: ['ns1.ovh.net'] }), 'Shopify')
  assert.equal(detectHosting({ reverseDns: ['ns3012345.ip-51-68-1.eu'] }), 'OVHcloud')
  assert.equal(detectHosting({ reverseDns: ['web12.o2switch.net'] }), 'o2switch')
  assert.equal(detectHosting({ headers: { server: 'cloudflare' } }), 'Derrière Cloudflare (hébergeur réel masqué)')
  assert.equal(detectHosting({ nameServers: ['lara.ns.cloudflare.com'] }), 'Derrière Cloudflare (hébergeur réel masqué)')
  assert.equal(detectHosting({}), null)
})

test('detectTechnologies repère le CMS dans le HTML et les en-têtes', () => {
  assert.deepEqual(
    detectTechnologies({ html: '<link href="/wp-content/themes/x/style.css"><meta name="generator" content="WordPress 6.6">' }),
    ['WordPress']
  )
  assert.deepEqual(detectTechnologies({ html: '<script src="https://cdn.shopify.com/s/files/app.js"></script>' }), ['Shopify'])
  assert.deepEqual(detectTechnologies({ headers: { 'x-powered-by': 'PHP/8.2' } }), ['PHP'])
  assert.deepEqual(detectTechnologies({ html: '<meta name="generator" content="Hugo 0.120">' }), ['Hugo 0.120'])
  assert.deepEqual(detectTechnologies({ html: '<p>Bonjour</p>' }), [])
})

test('isPrivateIp bloque les adresses internes et laisse passer les adresses publiques', () => {
  for (const ip of ['10.0.0.5', '127.0.0.1', '172.20.1.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd12::1', 'fe80::1', '::ffff:10.0.0.1', 'pas-une-ip']) {
    assert.equal(isPrivateIp(ip), true, ip)
  }
  for (const ip of ['51.68.1.2', '8.8.8.8', '172.32.0.1', '2001:4860:4860::8888']) {
    assert.equal(isPrivateIp(ip), false, ip)
  }
})

test('parseRdapRegistrar lit le nom du bureau d’enregistrement dans la vCard RDAP', () => {
  const rdap = {
    entities: [
      { roles: ['registrant'], vcardArray: ['vcard', [['fn', {}, 'text', 'Le prospect']]] },
      { roles: ['registrar'], vcardArray: ['vcard', [['version', {}, 'text', '4.0'], ['fn', {}, 'text', 'OVH SAS']]] }
    ]
  }
  assert.equal(parseRdapRegistrar(rdap), 'OVH SAS')
  assert.equal(parseRdapRegistrar({}), null)
  assert.equal(parseRdapRegistrar(null), null)
})

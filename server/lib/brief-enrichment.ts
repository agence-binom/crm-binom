import { lookup, resolve4, resolveMx, resolveNs, reverse } from 'node:dns/promises'
import { isIP } from 'node:net'
import type { BriefEnrichment } from '~/types/brief'

const PROBE_TIMEOUT_MS = 5_000
const MAX_HTML_BYTES = 1024 * 1024
const MAX_REDIRECTS = 3

type HeaderMap = Record<string, string>

const findLabel = (rules: [RegExp, string][], haystacks: string[]) => {
  for (const [pattern, label] of rules) {
    if (haystacks.some(value => pattern.test(value))) return label
  }
  return null
}

const emailProviderRules: [RegExp, string][] = [
  [/(^|\.)(google|googlemail)\.com$/, 'Google Workspace'],
  [/(^|\.)(outlook\.com|protection\.outlook\.com)$/, 'Microsoft 365'],
  [/(^|\.)ovh\.net$/, 'OVHcloud'],
  [/(^|\.)gandi\.net$/, 'Gandi'],
  [/(^|\.)(ionos\.[a-z]+|kundenserver\.de|perfora\.net)$/, 'IONOS'],
  [/(^|\.)zoho(mail)?\.[a-z]+$/, 'Zoho Mail'],
  [/(^|\.)proton(mail)?\.ch$/, 'Proton Mail'],
  [/(^|\.)o2switch\.net$/, 'o2switch'],
  [/(^|\.)hostinger\.[a-z]+$/, 'Hostinger'],
  [/(^|\.)infomaniak\.(ch|com)$/, 'Infomaniak'],
  [/(^|\.)icloud\.com$/, 'iCloud Mail'],
  [/(^|\.)lws(-hosting)?\.(fr|net)$/, 'LWS'],
  [/(^|\.)amazonaws\.com$/, 'Amazon SES'],
  [/(^|\.)mailinblack\.com$/, 'Mailinblack (filtrage)'],
  [/(^|\.)(mimecast|pphosted)\.com$/, 'Passerelle de filtrage (Mimecast / Proofpoint)']
]

export function detectEmailProvider(mxHosts: string[]) {
  return findLabel(emailProviderRules, mxHosts.map(host => host.toLowerCase().replace(/\.$/, '')))
}

// Les plateformes qui hébergent et servent le site se reconnaissent à leurs en-têtes ; pour un
// hébergement classique, seul le reverse DNS de l'IP trahit l'hébergeur. Cloudflare passe en
// dernier : il se place devant l'hébergeur réel et le masque.
const platformHostingRules: [RegExp, string][] = [
  [/x-shopid|x-shopify/, 'Shopify'],
  [/x-wix-request-id|server: pepyaka/, 'Wix'],
  [/x-vercel-id|server: vercel/, 'Vercel'],
  [/x-nf-request-id|server: netlify/, 'Netlify'],
  [/server: squarespace/, 'Squarespace'],
  [/x-github-request-id|server: github\.com/, 'GitHub Pages'],
  [/x-kinsta-cache/, 'Kinsta'],
  [/x-powered-by: wp engine|wpe-backend/, 'WP Engine']
]

const reverseDnsHostingRules: [RegExp, string][] = [
  [/\.ovh\.(net|ca|us)$|\.ip-[\d-]+\.eu$/, 'OVHcloud'],
  [/o2switch/, 'o2switch'],
  [/hostinger/, 'Hostinger'],
  [/(ionos|1and1|kundenserver|perfora)/, 'IONOS'],
  [/infomaniak/, 'Infomaniak'],
  [/(your-server\.de|hetzner)/, 'Hetzner'],
  [/(scaleway|scw\.cloud|online\.net|poneytelecom)/, 'Scaleway'],
  [/amazonaws\.com$/, 'Amazon Web Services'],
  [/googleusercontent\.com$/, 'Google Cloud'],
  [/gandi\.net$/, 'Gandi'],
  [/(lws|lwsd)\.(fr|net)$/, 'LWS'],
  [/planethoster/, 'PlanetHoster'],
  [/(webflow|squarespace|shopify|wix)/, 'Plateforme SaaS'],
  [/cloudflare/, 'Cloudflare']
]

export function detectHosting({ headers = {}, reverseDns = [], nameServers = [] }: {
  headers?: HeaderMap
  reverseDns?: string[]
  nameServers?: string[]
}) {
  const headerLines = Object.entries(headers).map(([name, value]) => `${name.toLowerCase()}: ${value.toLowerCase()}`)

  const platform = findLabel(platformHostingRules, headerLines)
  if (platform) return platform

  const fromReverse = findLabel(reverseDnsHostingRules, reverseDns.map(host => host.toLowerCase()))
  if (fromReverse && fromReverse !== 'Cloudflare') return fromReverse

  const behindCloudflare = fromReverse === 'Cloudflare'
    || headerLines.some(line => line === 'server: cloudflare' || line.startsWith('cf-ray:'))
    || nameServers.some(ns => ns.toLowerCase().endsWith('.ns.cloudflare.com'))
  return behindCloudflare ? 'Derrière Cloudflare (hébergeur réel masqué)' : null
}

const technologyRules: [RegExp, string][] = [
  [/wp-content|wp-includes|content="wordpress/i, 'WordPress'],
  [/woocommerce/i, 'WooCommerce'],
  [/elementor/i, 'Elementor'],
  [/cdn\.shopify\.com|x-shopid/i, 'Shopify'],
  [/prestashop/i, 'PrestaShop'],
  [/static\.wixstatic\.com|x-wix-request-id/i, 'Wix'],
  [/data-wf-page|content="webflow/i, 'Webflow'],
  [/static1\.squarespace\.com|squarespace/i, 'Squarespace'],
  [/content="joomla/i, 'Joomla'],
  [/content="drupal|x-drupal-cache|drupal-settings-json/i, 'Drupal'],
  [/mage\/cookies|magento/i, 'Magento'],
  [/framerusercontent\.com/i, 'Framer'],
  [/jimdo/i, 'Jimdo'],
  [/__next_data__|x-powered-by: next\.js/i, 'Next.js'],
  [/__nuxt|\/_nuxt\//i, 'Nuxt'],
  [/content="astro/i, 'Astro'],
  [/x-powered-by: php/i, 'PHP']
]

export function detectTechnologies({ html = '', headers = {} }: { html?: string, headers?: HeaderMap }) {
  const headerText = Object.entries(headers).map(([name, value]) => `${name}: ${value}`).join('\n')
  const haystack = `${headerText}\n${html}`
  const detected = technologyRules.filter(([pattern]) => pattern.test(haystack)).map(([, label]) => label)

  const generator = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']{1,100})["']/i)?.[1]?.trim()
  if (generator && !detected.some(label => generator.toLowerCase().includes(label.toLowerCase()))) {
    detected.push(generator)
  }

  return [...new Set(detected)]
}

const ipv4ToNumber = (ip: string) => ip.split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0

const blockedIpv4Ranges: [string, number][] = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['224.0.0.0', 4], ['240.0.0.0', 4]
]

// Le domaine vient du prospect : sans ce filtre, « mon-site.fr » pointé sur 10.0.0.5 ferait
// interroger par le CRM un service du réseau interne Coolify.
export function isPrivateIp(ip: string) {
  const version = isIP(ip)
  if (version === 4) {
    const value = ipv4ToNumber(ip)
    return blockedIpv4Ranges.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
      return (value & mask) === (ipv4ToNumber(base) & mask)
    })
  }
  if (version === 6) {
    const normalized = ip.toLowerCase()
    const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1]
    if (mappedIpv4) return isPrivateIp(mappedIpv4)
    return normalized === '::' || normalized === '::1' || /^f[cd]/.test(normalized) || /^fe[89ab]/.test(normalized) || /^ff/.test(normalized)
  }
  return true
}

type RdapEntity = { roles?: string[], vcardArray?: [string, [string, unknown, string, unknown][]], entities?: RdapEntity[] }

export function parseRdapRegistrar(rdap: unknown) {
  const entities = (rdap as { entities?: RdapEntity[] } | null)?.entities ?? []
  const registrar = entities.find(entity => entity.roles?.includes('registrar'))
  const fullName = registrar?.vcardArray?.[1]?.find(property => property[0] === 'fn')?.[3]
  return typeof fullName === 'string' && fullName.trim() ? fullName.trim() : null
}

const withTimeout = <T>(promise: Promise<T>, label: string) => Promise.race([
  promise,
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} : délai dépassé`)), PROBE_TIMEOUT_MS))
])

const errorMessage = (reason: unknown) => (reason instanceof Error ? reason.message : String(reason))

const assertPublicHttpUrl = async (url: URL) => {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Protocole refusé')
  if (url.port && url.port !== '80' && url.port !== '443') throw new Error('Port refusé')
  if (isIP(url.hostname.replace(/^\[|\]$/g, ''))) throw new Error('Adresse IP directe refusée')

  const addresses = await lookup(url.hostname, { all: true })
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error('Le domaine pointe vers une adresse non publique')
  }
}

const readLimitedText = async (response: Response) => {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (total < MAX_HTML_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.byteLength
  }
  await reader.cancel().catch(() => {})

  return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, MAX_HTML_BYTES))
}

// Redirections suivies à la main pour revérifier l'IP à chaque saut : une redirection vers
// http://127.0.0.1 contournerait sinon le contrôle fait sur l'URL de départ. Reste une fenêtre de
// DNS rebinding entre notre lookup et celui de fetch - acceptée : la requête est un GET sans
// identifiants dont la réponse n'est jamais renvoyée à celui qui a fourni le domaine.
const fetchHomepage = async (domain: string, protocol: 'https' | 'http' = 'https') => {
  let url = new URL(`${protocol}://${domain}/`)

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHttpUrl(url)
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      headers: { 'user-agent': 'binom-crm-brief-enrichment/1.0', 'accept': 'text/html' }
    })

    const location = response.headers.get('location')
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel()
      url = new URL(location, url)
      continue
    }

    const headers: HeaderMap = {}
    response.headers.forEach((value, name) => {
      headers[name] = value
    })
    return { finalUrl: url.toString(), headers, html: await readLimitedText(response) }
  }

  throw new Error('Trop de redirections')
}

const fetchRegistrar = async (domain: string) => {
  const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    headers: { accept: 'application/rdap+json' }
  })
  if (!response.ok) throw new Error(`RDAP : réponse ${response.status}`)
  return parseRdapRegistrar(await response.json())
}

// Ne lève jamais : chaque sonde échoue indépendamment et sa raison est conservée dans errors.
export async function enrichDomain(domain: string): Promise<BriefEnrichment> {
  const errors: Record<string, string> = {}

  const [nsResult, mxResult, aResult, rdapResult, homepageResult] = await Promise.allSettled([
    withTimeout(resolveNs(domain), 'DNS NS'),
    withTimeout(resolveMx(domain), 'DNS MX'),
    withTimeout(resolve4(domain), 'DNS A'),
    withTimeout(fetchRegistrar(domain), 'RDAP'),
    // Encore des sites sans certificat valide : on retente en HTTP plutôt que de renoncer.
    withTimeout(fetchHomepage(domain).catch(() => fetchHomepage(domain, 'http')), 'Site')
  ])

  const nameServers = nsResult.status === 'fulfilled' ? nsResult.value.map(ns => ns.toLowerCase()).sort() : []
  if (nsResult.status === 'rejected') errors.nameServers = errorMessage(nsResult.reason)

  const mxHosts = mxResult.status === 'fulfilled'
    ? mxResult.value.sort((a, b) => a.priority - b.priority).map(mx => mx.exchange.toLowerCase()).filter(Boolean)
    : []
  // ENODATA / ENOTFOUND = pas de MX, ce qui est une réponse et non une panne.
  if (mxResult.status === 'rejected' && !/ENODATA|ENOTFOUND/.test(errorMessage(mxResult.reason))) {
    errors.mxHosts = errorMessage(mxResult.reason)
  }

  const ipAddresses = aResult.status === 'fulfilled' ? aResult.value : []
  if (aResult.status === 'rejected') errors.ipAddresses = errorMessage(aResult.reason)

  const publicIp = ipAddresses.find(ip => !isPrivateIp(ip))
  const reverseResult = publicIp ? await Promise.allSettled([withTimeout(reverse(publicIp), 'Reverse DNS')]) : []
  const reverseDns = reverseResult[0]?.status === 'fulfilled' ? reverseResult[0].value : []

  const registrar = rdapResult.status === 'fulfilled' ? rdapResult.value : null
  if (rdapResult.status === 'rejected') errors.registrar = errorMessage(rdapResult.reason)

  const homepage = homepageResult.status === 'fulfilled' ? homepageResult.value : null
  if (homepageResult.status === 'rejected') errors.website = errorMessage(homepageResult.reason)

  return {
    domain,
    registrar,
    nameServers,
    mxHosts,
    emailProvider: detectEmailProvider(mxHosts),
    ipAddresses,
    reverseDns,
    hosting: detectHosting({ headers: homepage?.headers, reverseDns, nameServers }),
    technologies: homepage ? detectTechnologies(homepage) : [],
    finalUrl: homepage?.finalUrl ?? null,
    ...(Object.keys(errors).length > 0 ? { errors } : {})
  }
}

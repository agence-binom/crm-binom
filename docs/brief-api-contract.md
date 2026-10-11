# Brief pré-rendez-vous : contrat entre le site public et le CRM

Ce document décrit ce que le site (projet Astro) doit appeler pour afficher le formulaire de brief et transmettre les réponses au CRM.

## Changements depuis la v1

Seul le **préremplissage** évolue, et uniquement par ajouts : un site qui ignore les nouveaux champs continue de fonctionner. Les URL, l'authentification, la soumission et les codes d'erreur ne changent pas.

| Champ de `prefill` | Changement |
|---|---|
| `projectName` | **Nouveau.** Nom du projet que le brief vient cadrer, ou `null` quand le brief donnera naissance à un nouveau projet. Peut servir à afficher « Brief pour : … ». |
| `previousAnswers` | **Nouveau.** Réponses techniques du dernier brief complété par ce client, à proposer comme valeurs initiales. Tableau vide pour un nouveau client. Détail plus bas. |
| `website` | Même champ, nouvelle source : l'URL du projet cadré si elle existe, sinon le site de la fiche client. |

## Principe

1. Le CRM génère un lien personnel `https://<site>/brief/<jeton>` et l'équipe l'envoie au prospect.
2. Quand le prospect ouvre la page, le site appelle le CRM pour **préremplir** le formulaire. Cet appel marque aussi le brief comme « ouvert ».
3. À l'envoi du formulaire, le site **transmet les réponses** au CRM. Un lien ne peut être soumis qu'une fois.

Le jeton est la dernière partie de l'URL de la page. Le site le transmet tel quel au CRM.

## Authentification

**Tous les appels se font côté serveur** : endpoint Astro, action, ou page SSR. Le navigateur du prospect ne doit jamais appeler le CRM directement. Le secret ne doit jamais apparaître dans du code client, et le CRM n'envoie aucun en-tête CORS.

Chaque requête porte l'en-tête :

```
Authorization: Bearer <BRIEF_API_SECRET>
```

| Variable côté site | Valeur |
|---|---|
| `CRM_API_URL` | URL du CRM, sans slash final (ex. `https://crm.agence-binom.fr`) |
| `BRIEF_API_SECRET` | Même valeur que `NUXT_BRIEF_API_SECRET` côté CRM (32 caractères minimum) |

Le secret est transmis hors de tout dépôt Git. Le changer se fait en même temps des deux côtés.

## 1. Préremplissage

```
GET {CRM_API_URL}/api/external/briefs/{jeton}
```

**200**

```json
{
  "status": "opened",
  "expiresAt": "2026-11-10T12:00:00.000Z",
  "prefill": {
    "firstName": "Léa",
    "lastName": "Martin",
    "company": "Boulangerie Martin",
    "email": "lea@boulangerie-martin.fr",
    "phone": "+33 6 45 67 89 01",
    "website": "https://boulangerie-martin.fr",
    "projectName": null,
    "previousAnswers": [
      { "id": "current_website", "status": "answered", "value": "https://boulangerie-martin.fr" },
      { "id": "domain_registrar", "status": "unknown" },
      { "id": "access_availability", "status": "answered", "value": "to_find" }
    ]
  }
}
```

- Chaque champ de `prefill` peut valoir `null`, sauf `company`. Le prospect doit pouvoir corriger ces valeurs dans le formulaire. Les valeurs corrigées sont renvoyées comme des réponses ordinaires (voir les identifiants plus bas).
- L'appel est sans risque à répéter, par exemple à chaque rechargement de la page.

### `previousAnswers` : un client qui revient n'a qu'à vérifier

Quand le client a déjà complété un brief, `previousAnswers` reprend ses réponses à la **partie technique**, qui change rarement d'un projet à l'autre. Le besoin, le budget et l'échéance ne sont jamais repris.
- Le format est celui des `answers` de la soumission, sans `label` ni `section` : `{ id, status, value }`, ou `{ id, status: "unknown" }` pour un « Je ne sais pas ».
- Questions concernées : `current_website`, `domain_registrar`, `site_manager`, `provider_informed`, `access_availability`, `domain_emails`, `email_provider`, `tools_to_connect`.
- Le site préremplit chaque question dont l'`id` correspond, en la laissant modifiable. Une question absente du tableau reste vide.
- Les réponses ainsi validées par le prospect sont renvoyées normalement dans la soumission. Le CRM ne les recopie jamais tout seul.

## 2. Envoi des réponses

```
POST {CRM_API_URL}/api/external/briefs/{jeton}/submission
Content-Type: application/json
```

```json
{
  "formVersion": "2026-10",
  "answers": [
    { "id": "project_type", "section": "Votre projet", "label": "Quel est votre projet ?", "status": "answered", "value": "redesign" },
    { "id": "goals", "section": "Votre projet", "label": "Vos objectifs principaux", "status": "answered", "value": ["Vendre en ligne", "Moderniser l'image"] },
    { "id": "domain_registrar", "section": "Votre site actuel", "label": "Où avez-vous acheté le nom de domaine ?", "status": "unknown" },
    { "id": "inspirations", "section": "Inspirations", "label": "Des sites que vous aimez ?", "status": "answered", "value": "…" }
  ]
}
```

| Champ | Règle |
|---|---|
| `formVersion` | Obligatoire, 50 caractères au plus. À changer à chaque évolution du formulaire, car le CRM la conserve avec chaque brief. |
| `answers` | 200 réponses au plus, dans l'ordre d'affichage du formulaire. Un même `id` ne doit apparaître qu'une fois. |
| `answers[].id` | Identifiant stable de la question, 100 caractères au plus. |
| `answers[].label` | Libellé tel qu'affiché au prospect. Le CRM l'affiche tel quel. |
| `answers[].section` | Titre de la section du formulaire. Facultatif. |
| `answers[].status` | `"answered"`, ou `"unknown"` quand le prospect a choisi « Je ne sais pas ». |
| `answers[].value` | Texte, nombre, booléen, liste de textes ou `null`. Ignoré quand `status` vaut `"unknown"`. |

Trois cas à bien distinguer :
- **Question sans réponse** : ne pas l'envoyer du tout.
- **« Je ne sais pas »** : l'envoyer avec `"status": "unknown"`.
- **Réponse donnée** : l'envoyer avec `"status": "answered"` et `value`.

Le corps de la requête est limité à 256 Ko.

**201**

```json
{ "status": "completed", "completedAt": "2026-10-11T14:03:12.000Z" }
```

Le CRM enregistre aussi **toutes les questions qu'il ne connaît pas**. On peut donc ajouter, retirer ou renommer des questions librement côté site. Seules les questions de la table ci-dessous alimentent la synthèse, les filtres et les alertes du CRM.

### Questions exploitées par le CRM

Pour que la synthèse, les filtres et les alertes fonctionnent, ces questions doivent garder exactement ces `id` et ces valeurs. Une valeur hors liste n'est pas une erreur : la réponse est enregistrée, mais elle n'apparaît pas dans la synthèse.

| `id` | Type de `value` | Valeurs attendues |
|---|---|---|
| `project_type` | texte | `showcase_site` (création vitrine), `redesign` (refonte), `ecommerce` (boutique en ligne), `feature` (fonctionnalité sur site existant), `internal_tool` (outil interne), `other` |
| `goals` | liste de textes | libre |
| `budget_range` | texte | `lt_3k`, `3k_6k`, `6k_12k`, `12k_25k`, `gt_25k`, `needs_advice` |
| `deadline` | texte | date `AAAA-MM-JJ` |
| `deadline_context` | texte | libre |
| `decision_maker` | texte | libre |
| `current_website` | texte | URL ou nom de domaine. Sert à l'analyse technique automatique. |
| `domain_registrar` | texte | libre (où le domaine a été acheté) |
| `site_manager` | texte | `internal`, `current_provider`, `former_provider`, `nobody` |
| `provider_informed` | booléen | `true` / `false` |
| `access_availability` | texte | `all`, `partial`, `to_find`, `unknown` |
| `domain_emails` | booléen | `true` / `false` (emails en @domaine) |
| `email_provider` | texte | libre (où ces emails sont gérés) |
| `tools_to_connect` | liste de textes | libre |

## Erreurs

Les réponses d'erreur sont en JSON. Pour les erreurs propres au lien, `data.code` est stable : c'est lui qu'il faut tester, pas le message.

| HTTP | `data.code` | Cause | Conduite côté site |
|---|---|---|---|
| 400 | (absent) | Corps invalide (`formVersion` manquant, `status` inconnu, `id` en double…) ou jeton mal formé dans l'URL. Le détail est dans `data`. | Bug d'intégration : à journaliser. Le lien n'est pas consommé, le prospect peut renvoyer après correction. |
| 401 | (absent) | Secret absent ou incorrect | Bug de configuration : à journaliser. Afficher une erreur générique. |
| 404 | `brief_not_found` | Jeton inconnu, brief supprimé, ou lien remplacé par une régénération | Page « Ce lien n'est plus valide, contactez-nous ». |
| 409 | `brief_already_completed` | Le brief a déjà été envoyé | Page « Merci, nous avons bien reçu vos réponses ». Aussi renvoyé par le préremplissage. |
| 410 | `brief_expired` | Le lien a dépassé sa date d'expiration (30 jours par défaut) | Page « Ce lien a expiré, contactez-nous pour en recevoir un nouveau ». |
| 413 | `payload_too_large` | Corps de plus de 256 Ko | Raccourcir les champs libres. |
| 429 | (absent) | Plus de 120 requêtes par minute depuis l'IP du serveur du site | Réessayer après quelques secondes. |
| 503 | (absent) | Le CRM n'a pas de secret configuré, ou sa base est injoignable | Afficher une erreur temporaire et réessayer plus tard. |

**Réessai après une coupure réseau à l'envoi** : si le site ne sait pas si son POST est arrivé, il peut le renvoyer. Une réponse `409 brief_already_completed` signifie alors que le premier envoi a bien été enregistré : il faut l'afficher comme un succès.

## Ce que le CRM fait après réception

Dans la même transaction que l'enregistrement des réponses, le CRM crée le projet correspondant (en avant-vente) ou complète les champs vides du projet que le brief cadrait. Si cette étape échoue, la soumission entière est refusée et peut être renvoyée : un `201` garantit donc que le projet existe.

Ensuite, sans effet sur la réponse renvoyée au site :
- l'équipe est prévenue par email, avec un lien vers le projet ;
- le nom de domaine (celui de `current_website`, à défaut celui du projet, puis celui de la fiche) est analysé automatiquement : bureau d'enregistrement, serveurs DNS, MX, hébergement probable, CMS.

## Données personnelles

Les réponses sont rattachées au prospect et à son projet, et supprimées avec l'un ou l'autre. Une suppression manuelle est aussi possible depuis la fiche.

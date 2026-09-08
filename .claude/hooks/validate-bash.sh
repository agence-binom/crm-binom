#!/usr/bin/env bash
# PreToolUse hook pour l'outil Bash : bloque certaines commandes destructrices ou
# à risque avant exécution. Reçoit sur stdin un JSON avec au moins tool_input.command
# (format Claude Code hooks). Exit != 0 = commande refusée, message affiché à l'agent.
set -euo pipefail

INPUT="$(cat)"

# Extraction minimaliste de tool_input.command sans dépendance à jq (pas garanti présent).
# On tente jq si dispo, sinon un fallback grep/sed suffisant pour ce cas d'usage.
if command -v jq >/dev/null 2>&1; then
  COMMAND="$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')"
else
  COMMAND="$(printf '%s' "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"command"[[:space:]]*:[[:space:]]*"(.*)"/\1/')"
fi

if [ -z "$COMMAND" ]; then
  exit 0
fi

block() {
  echo "🚫 Commande bloquée par .claude/hooks/validate-bash.sh" >&2
  echo "" >&2
  echo "Raison : $1" >&2
  echo "" >&2
  echo "Action alternative : $2" >&2
  exit 1
}

# --- git push --force / -f sur une branche protégée ---
if printf '%s' "$COMMAND" | grep -Eq '^\s*git\s+push\b'; then
  if printf '%s' "$COMMAND" | grep -Eq '(--force([^-]|$)|--force-with-lease|(^|[[:space:]])-f([[:space:]]|$))'; then
    if printf '%s' "$COMMAND" | grep -Eq '(main|master|production)\b'; then
      block "force-push détecté vers une branche protégée (main/master/production)." \
            "Demander confirmation humaine explicite avant tout force-push sur une branche protégée."
    fi
  fi
fi

# --- rm -rf sur des chemins sensibles ---
if printf '%s' "$COMMAND" | grep -Eq '\brm\b.*-[a-zA-Z]*r[a-zA-Z]*f|\brm\b.*-[a-zA-Z]*f[a-zA-Z]*r'; then
  if printf '%s' "$COMMAND" | grep -Eq '(^|[[:space:]])(/|~/?)([[:space:]]|$)|(^|[[:space:]])\.git([[:space:]/]|$)|(^|[[:space:]])/?node_modules([[:space:]]|$)'; then
    block "rm -rf sur un chemin sensible (racine /, home ~, .git, ou node_modules à la racine)." \
          "Cibler un chemin précis et non destructeur, ou demander confirmation humaine explicite si la suppression large est réellement voulue."
  fi
fi

# --- DROP TABLE / DROP DATABASE / TRUNCATE TABLE en SQL brut ---
if printf '%s' "$COMMAND" | grep -Eiq '\b(drop\s+table|drop\s+database|truncate\s+table)\b'; then
  block "Commande SQL destructrice détectée (DROP TABLE / DROP DATABASE / TRUNCATE TABLE)." \
        "Passer par une migration Drizzle versionnée (npm run db:generate) et demander confirmation humaine explicite avant toute exécution destructrice, y compris en local."
fi

# --- drizzle-kit push contre une base non locale ---
if printf '%s' "$COMMAND" | grep -Eq 'drizzle-kit[[:space:]]+push'; then
  if printf '%s' "$COMMAND" | grep -Eq 'DATABASE_URL'; then
    if ! printf '%s' "$COMMAND" | grep -Eq 'localhost|127\.0\.0\.1'; then
      block "drizzle-kit push exécuté avec une DATABASE_URL qui ne pointe pas vers localhost/127.0.0.1." \
            "drizzle-kit push est acceptable en dev local (localhost/127.0.0.1 dans DATABASE_URL). Contre une base distante (staging/prod, potentiellement partagée), utiliser le flux de migration standard (npm run db:generate && npm run db:migrate) et demander confirmation humaine explicite."
    fi
  fi
fi

# --- lecture directe d'un fichier .env ---
if printf '%s' "$COMMAND" | grep -Eq '\b(cat|less|more|head|tail)\b[^|]*\.env([^a-zA-Z0-9._-]|$)'; then
  block "Lecture directe d'un fichier .env." \
        "Ne jamais afficher le contenu d'un .env dans une sortie de commande. Si une valeur précise est nécessaire, demander à l'utilisateur de la fournir directement."
fi

# --- git add sur un fichier .env ---
if printf '%s' "$COMMAND" | grep -Eq '^\s*git\s+add\b.*\.env([^a-zA-Z0-9._-]|$)'; then
  block "Tentative de 'git add' sur un fichier .env." \
        "Ne jamais indexer un fichier .env. Vérifier .gitignore ; si le fichier doit vraiment être versionné (ex: .env.example sans secret), le nommer explicitement sans le suffixe .env réel."
fi

# --- déploiement mentionnant explicitement prod/production ---
if printf '%s' "$COMMAND" | grep -Eiq '\b(coolify|supabase[[:space:]]+db[[:space:]]+push|supabase[[:space:]]+migration[[:space:]]+up)\b'; then
  if printf '%s' "$COMMAND" | grep -Eiq '\bprod(uction)?\b'; then
    block "Commande de déploiement/migration mentionnant explicitement un environnement de production." \
          "Toute action touchant Coolify, le déploiement, ou une migration Supabase en environnement partagé (staging inclus) nécessite une validation humaine explicite (voir CLAUDE.md)."
  fi
fi

exit 0

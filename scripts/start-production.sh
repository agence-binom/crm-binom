#!/bin/sh
set -eu

node ./scripts/migrate-production.mjs
exec node ./.output/server/index.mjs

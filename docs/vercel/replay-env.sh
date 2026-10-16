#!/usr/bin/env bash
#
# Repõe as variáveis de ambiente dos quatro projetos na conta nova.
#
# Os valores vêm dos ficheiros `*.production.env` / `*.preview.env` exportados
# da conta antiga, que estão nesta mesma pasta. A exceção é o `dev-retex-portal`,
# cujas variáveis estavam marcadas como Secret na conta antiga e saíram como
# `[SENSITIVE]` — esses valores estão abaixo, inferidos dos outros projetos e
# confirmados (as duas APIs respondem, a chave TomTom é a mesma em todo o lado).
#
# Pré-requisitos:
#   1. Os quatro projetos já criados na conta nova (o CLI não define Root nem
#      Output Directory — isso é o fluxo de Import no dashboard).
#   2. `npx vercel login` com a conta de destino.
#
# Uso:
#   ./replay-env.sh [--dry-run] [scope]
#
set -euo pipefail

readonly HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && { DRY_RUN=true; shift; }
readonly SCOPE="${1:-tiago-8652s-projects}"

readonly PROJECTS=(retex-web retex-web-portal dev-retex-web dev-retex-portal)
readonly USER_VARS=(NX_APP NEXT_PUBLIC_API_URL NEXT_PUBLIC_PORTAL_URL
                    NEXT_PUBLIC_TOMTOM_API_URL NEXT_PUBLIC_TOMTOM_API_KEY)

info() { printf '\033[0;34m▸\033[0m %s\n' "$*"; }
ok()   { printf '\033[0;32m✓\033[0m %s\n' "$*"; }
warn() { printf '\033[0;33m!\033[0m %s\n' "$*" >&2; }

# Valor de uma variável num ficheiro exportado; vazio se não existir.
read_var() {
  local file="$1" key="$2" line
  [[ -f "$file" ]] || return 0
  line="$(grep -m1 "^${key}=" "$file" || true)"
  [[ -n "$line" ]] || return 0
  line="${line#*=}"
  line="${line%\"}"
  printf '%s' "${line#\"}"
}

# O dev-retex-portal não deu para exportar (eram Secret). Valores inferidos:
#   NX_APP .................. portal   (senão o build servia a landing)
#   NEXT_PUBLIC_API_URL ..... igual ao dev-retex-web; o host responde
#   TOMTOM .................. idênticos aos outros três projetos
fallback_var() {
  # Só o dev-retex-portal precisa de inferência. Aplicar isto aos outros
  # projetos punha NX_APP=portal na landing, que passaria a servir o portal.
  [[ "$1" == "dev-retex-portal" ]] || return 0
  case "$2" in
    NX_APP)                     printf 'portal' ;;
    NEXT_PUBLIC_API_URL)        printf 'https://api-dev.retex.pt/' ;;
    NEXT_PUBLIC_TOMTOM_API_URL) printf 'https://api.tomtom.com/search/2/search/' ;;
    NEXT_PUBLIC_TOMTOM_API_KEY) read_var "$HERE/dev-retex-web.production.env" "$2" ;;
    *)                          printf '' ;;
  esac
}

for project in "${PROJECTS[@]}"; do
  info "=== $project ==="
  workdir="$HERE/.link-$project"
  mkdir -p "$workdir"
  # O ensaio só mostra valores: não precisa de ligação nem de sessão iniciada.
  if [[ "$DRY_RUN" == false ]]; then
    (cd "$workdir" && npx -y vercel@latest link --yes --project "$project" --scope "$SCOPE" >/dev/null 2>&1) \
      || { warn "não consegui ligar a $project em $SCOPE — já foi criado no dashboard?"; continue; }
  fi

  for environment in production preview; do
    for key in "${USER_VARS[@]}"; do
      value="$(read_var "$HERE/$project.$environment.env" "$key")"
      [[ "$value" == "[SENSITIVE]" || -z "$value" ]] && value="$(fallback_var "$project" "$key")"
      [[ -n "$value" ]] || continue

      if [[ "$DRY_RUN" == true ]]; then
        case "$key" in
          *KEY|*PASSWORD) info "  [$environment] $key = ••••••" ;;
          *)              info "  [$environment] $key = $value" ;;
        esac
      else
        # `--type config --yes`: sem isto o CLI recusa valores que lhe pareçam
        # credenciais num NEXT_PUBLIC_, e pede confirmação interativa. O valor
        # vai por stdin para não ficar visível na lista de processos.
        printf '%s' "$value" \
          | (cd "$workdir" && npx -y vercel@latest env add "$key" "$environment" --type config --yes --scope "$SCOPE" >/dev/null 2>&1) \
          && ok "  [$environment] $key" \
          || warn "  [$environment] $key — falhou (já existe?)"
      fi
    done
  done
  rm -rf "$workdir"
done

info "Feito. Confirma com: npx vercel env ls --scope $SCOPE"

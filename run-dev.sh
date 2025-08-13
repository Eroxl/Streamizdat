#!/usr/bin/env bash
# Dev workflow helper for Streamizdat
# Provides convenience commands around docker-compose.dev.yaml
# Usage:
#   ./run-dev.sh up            # build (if needed) and start dev stack
#   ./run-dev.sh build         # force rebuild images
#   ./run-dev.sh down          # stop and remove containers
#   ./run-dev.sh logs [svc]    # tail logs (optionally one service)
#   ./run-dev.sh restart [svc] # restart entire stack or one service
#   ./run-dev.sh sh [svc]      # open a shell in a service (default: app)
#   ./run-dev.sh ps            # list containers
#   ./run-dev.sh prune         # remove dangling images/volumes (CAUTION)
#   ./run-dev.sh help          # show this help
#
# Environment overrides:
#   DEV_COMPOSE_FILE (default: docker-compose.dev.yaml)
#   DOCKER_COMPOSE (default: docker compose)

set -euo pipefail

DOCKER_COMPOSE=${DOCKER_COMPOSE:-docker compose}
COMPOSE_FILE=${DEV_COMPOSE_FILE:-docker-compose.dev.yaml}
STACK_NAME=${STACK_NAME:-streamizdat-dev}

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "ERROR: Compose file '$COMPOSE_FILE' not found." >&2
  exit 1
fi

compose() {
  DOCKER_BUILDKIT=1 $DOCKER_COMPOSE -f "$COMPOSE_FILE" "$@"
}

cmd=${1:-help}
shift || true

case "$cmd" in
  up)
    compose up --build --remove-orphans "$@"
    ;;
  build)
    compose build "$@"
    ;;
  down)
    compose down -v --remove-orphans "$@"
    ;;
  logs)
    compose logs -f --tail=200 "$@"
    ;;
  restart)
    if [[ $# -gt 0 ]]; then
      for svc in "$@"; do
        compose restart "$svc"
      done
    else
      compose down
      compose up -d --build
      compose logs -f --tail=50
    fi
    ;;
  sh)
    svc=${1:-app}
    shift || true
    compose exec "$svc" sh "$@"
    ;;
  ps)
    compose ps
    ;;
  prune)
    read -r -p "This will prune dangling images and unused volumes. Continue? [y/N] " ans
    if [[ $ans =~ ^[Yy]$ ]]; then
      docker image prune -f
      docker volume prune -f
    else
      echo "Aborted"
    fi
    ;;
  help|--help|-h)
    grep '^#' "$0" | sed 's/^# \{0,1\}//'
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    echo "Use './run-dev.sh help' for usage." >&2
    exit 1
    ;;
 esac

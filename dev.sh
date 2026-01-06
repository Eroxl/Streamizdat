#!/bin/bash

case "$1" in
  down)
    podman compose --env-file .env -f docker-compose.dev.yaml down
    ;;
  *)
    podman compose --env-file .env -f docker-compose.dev.yaml up --build
    ;;
esac

#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3000}"
BASE_URL="${BASE_URL:-http://${HOST}:${PORT}}"
HEADLESS="${HEADLESS:-true}"
NEXT_LOG="${NEXT_LOG:-/tmp/rawblock-next-local.log}"

cleanup() {
  if [[ -n "${NEXT_PID:-}" ]]; then
    kill "${NEXT_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "[release-gate:local] starting next dev on ${HOST}:${PORT}"
npm run dev -- --hostname "${HOST}" --port "${PORT}" >"${NEXT_LOG}" 2>&1 &
NEXT_PID=$!

echo "[release-gate:local] waiting for app boot"
for _ in $(seq 1 60); do
  if curl -sf "${BASE_URL}" >/dev/null; then
    break
  fi
  sleep 2
done

if ! curl -sf "${BASE_URL}" >/dev/null; then
  echo "[release-gate:local] app failed to boot"
  tail -n 120 "${NEXT_LOG}" || true
  exit 1
fi

echo "[release-gate:local] running qa:release-gate against ${BASE_URL}"
BASE_URL="${BASE_URL}" HEADLESS="${HEADLESS}" npm run qa:release-gate

echo "[release-gate:local] success"

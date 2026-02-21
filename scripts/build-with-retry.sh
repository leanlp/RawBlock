#!/usr/bin/env bash
set -euo pipefail

MAX_RETRIES="${MAX_RETRIES:-3}"
RETRY_DELAY_SECONDS="${RETRY_DELAY_SECONDS:-8}"
LAST_LOG_FILE=""

is_transient_font_failure() {
  local file="$1"
  grep -Eiq "fonts\.gstatic\.com|internal/font/google|Can't resolve '@vercel/turbopack-next/internal/font/google/font'|Connection timed out when requesting https://fonts\.gstatic\.com" "$file"
}

for attempt in $(seq 1 "${MAX_RETRIES}"); do
  echo "[build:retry] attempt ${attempt}/${MAX_RETRIES}"
  LOG_FILE="$(mktemp -t rawblock-build-XXXX.log)"
  LAST_LOG_FILE="${LOG_FILE}"

  if npm run build >"${LOG_FILE}" 2>&1; then
    cat "${LOG_FILE}"
    rm -f "${LOG_FILE}"
    echo "[build:retry] build passed"
    exit 0
  fi

  cat "${LOG_FILE}"

  if [[ "${attempt}" -lt "${MAX_RETRIES}" ]] && is_transient_font_failure "${LOG_FILE}"; then
    echo "[build:retry] transient Google Font/network failure detected. Retrying in ${RETRY_DELAY_SECONDS}s..."
    sleep "${RETRY_DELAY_SECONDS}"
    rm -f "${LOG_FILE}"
    continue
  fi

  echo "[build:retry] build failed with non-retryable error (or retries exhausted)."
  exit 1
done

echo "[build:retry] build failed after ${MAX_RETRIES} attempts."
if [[ -n "${LAST_LOG_FILE}" && -f "${LAST_LOG_FILE}" ]]; then
  cat "${LAST_LOG_FILE}"
fi
exit 1

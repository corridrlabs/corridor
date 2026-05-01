#!/usr/bin/env bash
set -euo pipefail

# CI-style smoke checks against deployed Render API.
# Validates:
# 1) auth/register + auth/login
# 2) wallet connection path (/api/wallets/managed)
# 3) payment flow path (/api/funding-sources -> /api/fund-wallet -> /api/social/pay)
#
# Usage:
#   RENDER_API_BASE_URL="https://payday-kqgb.onrender.com" ./scripts/render_healthcheck.sh

BASE_URL="${RENDER_API_BASE_URL:-https://payday-kqgb.onrender.com}"
PASSWORD="${HEALTHCHECK_PASSWORD:-Passw0rd!123}"
PHONE_PREFIX="${HEALTHCHECK_PHONE_PREFIX:-+254799}"

ts="$(date +%s)"
email_a="hc.${ts}.a@example.com"
email_b="hc.${ts}.b@example.com"

code_of() {
  sed -n '1s/.* \([0-9][0-9][0-9]\).*/\1/p' <<<"$1"
}

body_of() {
  sed -n '/^\r$/,$p' <<<"$1" | sed '1d'
}

extract_token() {
  # Works for envelope responses that include "access_token":"..."
  printf '%s' "$1" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p' | head -n1 | tr -d '\r\n'
}

register_user() {
  local email="$1"
  local name="$2"
  local phone="${PHONE_PREFIX}${RANDOM}"
  curl -sS -i -X POST "${BASE_URL}/api/auth/register" \
    -H 'Content-Type: application/json' \
    --data "{\"email\":\"${email}\",\"name\":\"${name}\",\"type\":\"PERSONAL\",\"password\":\"${PASSWORD}\",\"phone\":\"${phone}\",\"country\":\"KE\"}"
}

login_user() {
  local email="$1"
  curl -sS -i -X POST "${BASE_URL}/api/auth/login" \
    -H 'Content-Type: application/json' \
    --data "{\"email\":\"${email}\",\"password\":\"${PASSWORD}\"}"
}

add_funding_source() {
  local token="$1"
  curl -sS -i -X POST "${BASE_URL}/api/funding-sources" \
    -H "Authorization: Bearer ${token}" \
    -H 'Content-Type: application/json' \
    --data '{"type":"BANK","last4":"1234","expiry":"12/30","brand":"HealthCheckBank","external_id":"hc_bank_001"}'
}

fund_wallet() {
  local token="$1"
  local source_id="$2"
  local amount="$3"
  curl -sS -i -X POST "${BASE_URL}/api/fund-wallet" \
    -H "Authorization: Bearer ${token}" \
    -H 'Content-Type: application/json' \
    --data "{\"source_id\":\"${source_id}\",\"amount\":${amount},\"currency\":\"USD\"}"
}

create_social_payment() {
  local token="$1"
  local to_email="$2"
  local amount="$3"
  curl -sS -i -X POST "${BASE_URL}/api/social/pay" \
    -H "Authorization: Bearer ${token}" \
    -H 'Content-Type: application/json' \
    --data "{\"to_email\":\"${to_email}\",\"amount\":${amount},\"currency\":\"USD\",\"message\":\"render healthcheck\"}"
}

echo "Render healthcheck target: ${BASE_URL}"
echo "Synthetic users: ${email_a}, ${email_b}"

r1="$(register_user "${email_a}" "Healthcheck User A")"
r2="$(register_user "${email_b}" "Healthcheck User B")"
l1="$(login_user "${email_a}")"
l2="$(login_user "${email_b}")"

r1_code="$(code_of "${r1}")"
r2_code="$(code_of "${r2}")"
l1_code="$(code_of "${l1}")"
l2_code="$(code_of "${l2}")"

if [[ "${r1_code}" != "201" || "${r2_code}" != "201" || "${l1_code}" != "200" || "${l2_code}" != "200" ]]; then
  echo "FAILED: auth register/login"
  echo "register A status=${r1_code} body=$(body_of "${r1}")"
  echo "register B status=${r2_code} body=$(body_of "${r2}")"
  echo "login A status=${l1_code} body=$(body_of "${l1}")"
  echo "login B status=${l2_code} body=$(body_of "${l2}")"
  exit 1
fi

token_a="$(extract_token "$(body_of "${l1}")")"
token_b="$(extract_token "$(body_of "${l2}")")"

if [[ -z "${token_a}" || -z "${token_b}" ]]; then
  echo "FAILED: missing auth token(s)"
  exit 1
fi

# 1) Wallet connection smoke check (this catches missing managed_wallets table)
managed_wallet_resp="$(curl -sS -i -X POST "${BASE_URL}/api/wallets/managed" \
  -H "Authorization: Bearer ${token_a}")"
managed_wallet_code="$(code_of "${managed_wallet_resp}")"

if [[ "${managed_wallet_code}" != "200" ]]; then
  echo "FAILED: /api/wallets/managed"
  echo "status=${managed_wallet_code} body=$(body_of "${managed_wallet_resp}")"
  exit 1
fi

# 2) Payments smoke check
fs_a="$(add_funding_source "${token_a}")"
fs_b="$(add_funding_source "${token_b}")"
fs_a_code="$(code_of "${fs_a}")"
fs_b_code="$(code_of "${fs_b}")"
fs_a_body="$(body_of "${fs_a}")"
fs_b_body="$(body_of "${fs_b}")"
fs_a_id="$(printf '%s' "${fs_a_body}" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1)"
fs_b_id="$(printf '%s' "${fs_b_body}" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1)"

if [[ "${fs_a_code}" != "200" || "${fs_b_code}" != "200" || -z "${fs_a_id}" || -z "${fs_b_id}" ]]; then
  echo "FAILED: funding source setup"
  echo "fs A status=${fs_a_code} body=${fs_a_body}"
  echo "fs B status=${fs_b_code} body=${fs_b_body}"
  exit 1
fi

fw_a="$(fund_wallet "${token_a}" "${fs_a_id}" 20)"
fw_b="$(fund_wallet "${token_b}" "${fs_b_id}" 2)"
fw_a_code="$(code_of "${fw_a}")"
fw_b_code="$(code_of "${fw_b}")"

if [[ "${fw_a_code}" != "200" || "${fw_b_code}" != "200" ]]; then
  echo "FAILED: /api/fund-wallet"
  echo "fund A status=${fw_a_code} body=$(body_of "${fw_a}")"
  echo "fund B status=${fw_b_code} body=$(body_of "${fw_b}")"
  exit 1
fi

pay_resp="$(create_social_payment "${token_a}" "${email_b}" 5)"
pay_code="$(code_of "${pay_resp}")"
pay_body="$(body_of "${pay_resp}")"

if [[ "${pay_code}" != "200" || "${pay_body}" != *'"status":"COMPLETED"'* ]]; then
  echo "FAILED: /api/social/pay"
  echo "status=${pay_code} body=${pay_body}"
  exit 1
fi

echo "PASS: Render API auth, wallet connection, and payment smoke checks passed."

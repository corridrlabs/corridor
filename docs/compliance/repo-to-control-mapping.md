# Repo-to-Control Mapping Matrix
## Mapping Current Codebase to Regulatory Requirements

---

## 1. AUTHENTICATION & ACCESS CONTROL

### Implemented Controls
| Code Location | Control | Regulation | Status |
|---|---|---|---|
| `backend/internal/core/auth.go:33-42` | Password hashing with bcrypt (cost 12) + SHA-256 pre-hash | GDPR Art. 32, Kenya DPA s41 | ✅ Implemented |
| `backend/internal/core/auth.go:20-24` | JWT with registered claims (account_id, email) | OWASP, PCI DSS Req 8 | ✅ Implemented |
| `backend/cmd/api/main.go:222-249` | `authMiddleware` on all sensitive endpoints | NPSA s17, PCI DSS Req 8 | ✅ Implemented |
| `backend/cmd/api/main.go:455-475` | Admin role check (`acc.IsAdmin()`) | SOX, Internal Controls | ✅ Implemented |

### Gaps
| Regulation | Requirement | Gap | Priority |
|---|---|---|---|
| GDPR Art. 25, Kenya DPA s41 | Encryption of personal data at rest | No database encryption for PII fields (email, phone, name) | HIGH |
| PCI DSS Req 8.2.3 | Multi-factor authentication (MFA) | No MFA implementation for admin/high-risk accounts | HIGH |
| GDPR Art. 25, Kenya DPA s41 | Encryption of personal data in transit | No forced TLS 1.2+ check in code; relies on Nginx config | MEDIUM |
| NPSA s17A, POCA | Admin access logging for user/waitlist data | No audit log in `acc.IsAdmin()` path (`main.go:455-456`) | HIGH |
| GDPR Art. 5(1)(f), Kenya DPA s39 | Access logging for all personal data queries | No access log for `GetAccountByID`, `GetWaitlist` calls | HIGH |

---

## 2. KYC & CUSTOMER DUE DILIGENCE (CDD)

### Implemented Controls
| Code Location | Control | Regulation | Status |
|---|---|---|---|
| `backend/cmd/api/main.go:460-462` | Profile completion check (name, phone) | NPSA s17A, POCA CDD | ⚠️ Partial |
| `backend/cmd/api/main.go:461-462` | KYC status flag check (`APPROVED`, `VERIFIED`, `COMPLETED`) | NPSA s17A, POCA CDD | ⚠️ Partial |
| `backend/internal/core/kyc.go` | KYC service layer exists | NPSA s17A | ⚠️ Partial |

### Gaps
| Regulation | Requirement | Gap | Priority |
|---|---|---|---|
| NPSA s17A, POCA s36A | Verified government ID (document upload + OCR/biometric check) | KYC status is unverified flag; no document upload/verification | HIGH |
| POCA s36A(3), FATF Rec 10 | Beneficial ownership declaration (≥25% ownership) | No beneficial ownership collection for corporate accounts | HIGH |
| POCA s36A, FATF Rec 12 | Sanctions screening (UN, OFAC, EU) on onboarding | No sanctions check in `CreateAccount` (`auth.go:56`) | HIGH |
| POCA s36A, FATF Rec 12 | PEP (Politically Exposed Person) screening | No PEP check in onboarding flow | HIGH |
| NPSA s13, POCA s36B | Enhanced Due Diligence (EDD) for high-risk users | No EDD workflow or risk scoring | MEDIUM |
| Kenya DPA s25, GDPR Art. 5 | Purpose limitation for KYC data | No purpose tag on KYC data collection | MEDIUM |

---

## 3. AML/CFT (Anti-Money Laundering / Combating Financing of Terrorism)

### Implemented Controls
| Code Location | Control | Regulation | Status |
|---|---|---|---|
| `backend/cmd/api/main.go:228-249` | `complianceMiddleware` gating sensitive endpoints | NPSA s17A, POCA | ⚠️ Partial |

### Gaps
| Regulation | Requirement | Gap | Priority |
|---|---|---|---|
| POCA s36B, FATF Rec 20 | Transaction monitoring for suspicious activity | No transaction monitoring rules/hooks in `wallet_helpers.go`, `payouts.go` | HIGH |
| POCA s36B, FATF Rec 19 | Suspicious Activity Report (SAR) workflow to FRC (Kenya) | No SAR creation/review workflow | HIGH |
| POCA s36A, FATF Rec 10 | Sanctions screening on transactions (not just onboarding) | No real-time sanctions check for `send_payment`, `payouts` | HIGH |
| POCA s36B, FATF Rec 22 | Record retention (5+ years) for transactions and KYC | No retention policy in DB schema (`adapters/db/`) | HIGH |
| FATF Rec 15 | New technologies risk assessment (crypto, P2P) | No risk flag for Solana transactions in `solana_withdraw.go` | MEDIUM |
| POCA s36C, FATF Rec 5 | VASP (Virtual Asset Service Provider) registration | No VASP Act 2025 compliance (Cap. 491B) | HIGH |

---

## 4. DATA PROTECTION (Kenya DPA, GDPR Equivalents)

### Implemented Controls
| Code Location | Control | Regulation | Status |
|---|---|---|---|
| `backend/internal/core/auth.go:51-52` | Email normalization (lowercase, trim) | Data hygiene | ✅ Implemented |
| `backend/cmd/api/handlers_settings.go:47-69` | Feature access API (privacy by design gating) | Kenya DPA s25, GDPR Art. 25 | ⚠️ Partial |

### Gaps
| Regulation | Requirement | Gap | Priority |
|---|---|---|---|
| Kenya DPA s18, GDPR Art. 30 | Data controller/processor registration with ODPC | No ODPC registration certificate or DPO appointment | HIGH |
| Kenya DPA s26, GDPR Art. 15 | Data subject access request (DSAR) API endpoint | No `/api/gdpr/export-my-data` endpoint | HIGH |
| Kenya DPA s40, GDPR Art. 17 | Data subject erasure ("right to be forgotten") API | No `/api/gdpr/delete-my-data` endpoint | HIGH |
| Kenya DPA s38, GDPR Art. 20 | Data portability (machine-readable format) | No JSON/CSV export for user data | MEDIUM |
| Kenya DPA s43, GDPR Art. 33 | 72-hour personal data breach notification to ODPC | No breach detection or notification workflow | HIGH |
| Kenya DPA s25(h), GDPR Art. 44 | Cross-border data transfer safeguards | No consent or adequacy check for data sent to Circle/Stripe/Solana | HIGH |
| Kenya DPA s39, GDPR Art. 5(1)(e) | Data retention limits (purpose-based deletion) | No automated deletion for stale personal data | MEDIUM |
| Kenya DPA s32, GDPR Art. 7 | Consent management (withdrawal, proof of consent) | No consent ledger for TOS, privacy policy acceptance | HIGH |

---

## 5. PAYMENT SERVICE PROVIDER AUTHORIZATION

### Implemented Controls
| Code Location | Control | Regulation | Status |
|---|---|---|---|
| `backend/cmd/api/main.go:228-249` | `requireFeature` gating by plan tier | NPSA s12, commercial | ✅ Implemented |

### Gaps
| Regulation | Requirement | Gap | Priority |
|---|---|---|---|
| NPSA s12-13 | CBK Payment Service Provider license | No CBK authorization evidence in repo | CRITICAL |
| NPSA s13 | Capital adequacy demonstration | No capital/liquidity checks in `treasury.go` | HIGH |
| NPSA s20 | Monthly transaction reports to CBK | No regulatory reporting API in `service.go` | HIGH |
| NPSA s17A | AML/CFT supervision by CBK | No CBK audit trail or inspection readiness | HIGH |

---

## 6. PCI DSS (If Processing Card Data)

### Implemented Controls
| Code Location | Control | Regulation | Status |
|---|---|---|---|
| `backend/internal/core/service.go:30-31` | Stripe SDK integration (tokenization) | PCI DSS Req 3.4 (no CHD storage) | ⚠️ Partial |

### Gaps
| Regulation | Requirement | Gap | Priority |
|---|---|---|---|
| PCI DSS v4.0.1 Req 3.4 | No cardholder data (CHD) stored in Corridor DB | No CHD scan audit in `adapters/db/` schema | HIGH |
| PCI DSS v4.0.1 Req 4.1 | TLS 1.2+ for all payment endpoints | No forced TLS check in `main.go` handlers | MEDIUM |
| PCI DSS v4.0.1 Req 10.2 | Audit logs for all access to card data | No card data access logging | HIGH |
| PCI DSS v4.0.1 Req 11.3 | Quarterly vulnerability scans | No vulnerability scan CI/CD in `Makefile` | MEDIUM |
| PCI DSS v4.0.1 Req 12.8 | TPSP (Third-Party Service Provider) vendor management | No vendor risk assessment for Stripe/Circle | MEDIUM |

---

## 7. CONSUMER PROTECTION & FUNDS SAFEGUARDING

### Implemented Controls
| Code Location | Control | Regulation | Status |
|---|---|---|---|
| `frontend/src/pages/Dashboard.tsx:143-145` | KYC/pending nudge on dashboard | Consumer transparency | ✅ Implemented |
| `frontend/src/pages/Dashboard.tsx:162-166` | Paywall redirect for higher-plan features | Fee transparency (partial) | ⚠️ Partial |

### Gaps
| Regulation | Requirement | Gap | Priority |
|---|---|---|---|
| Consumer Protection Act 2012 (Cap. 498) | Clear fee disclosures before transactions | No fee schedule API or pre-transaction disclosure | HIGH |
| Consumer Protection Act 2012 | Dispute resolution mechanism (≤30 days) | No dispute API (`/api/disputes`) or admin workflow | HIGH |
| NPSA s17, FATF Rec 16 | Refund policy for failed transactions | No refund workflow in `payouts.go`, `payment_rails.go` | HIGH |
| NPSA s17, FATF Rec 16 | Customer funds safeguarding (segregated accounts) | No reconciliation in `treasury.go` for customer vs. operational funds | HIGH |
| NPSA s17 | Daily reconciliation of wallets vs. ledger | No automated reconciliation in `wallet_helpers.go` | MEDIUM |

---

## 8. ADMIN AUDIT & OPERATIONAL RESILIENCE

### Implemented Controls
| Code Location | Control | Regulation | Status |
|---|---|---|---|
| `backend/internal/core/admin.go` | Admin service layer exists | Internal controls | ⚠️ Partial |
| `backend/internal/core/admin_hardening.go` | Admin hardening exists | Internal controls | ⚠️ Partial |

### Gaps
| Regulation | Requirement | Gap | Priority |
|---|---|---|---|
| NPSA s17, SOX | Admin audit log for all user data access | No audit log table in `adapters/db/` schema | HIGH |
| NPSA s17 | Admin audit log for waitlist data access | No log in admin handlers | HIGH |
| NPSA s17, FATF Rec 16 | Incident response plan for payment outages | No incident response plan in `/docs/` | MEDIUM |
| NPSA s20 | Record retention for audit logs (7+ years) | No retention policy for audit logs | MEDIUM |
| ISO 27001 | System uptime monitoring for payment rails | No health checks for Circle/Solana/Stripe in `service.go` | MEDIUM |

---

## 9. CROSS-BORDER & REMITTANCE CONTROLS

### Implemented Controls
| Code Location | Control | Regulation | Status |
|---|---|---|---|
| `backend/internal/core/payment_rails.go` | Multi-rail payment support (M-Pesa, Stripe, Solana) | Cross-border readiness | ⚠️ Partial |

### Gaps
| Regulation | Requirement | Gap | Priority |
|---|---|---|---|
| World Bank GPSS, FATF Rec 16 | Source of funds verification for remittance >$1000 | No source of funds check in `payouts.go` | HIGH |
| FATF Rec 16, POCA s36B | Cross-border transaction reporting (CBK, FRC) | No cross-border reporting in `service.go` | HIGH |
| Kenya DPA s25(h) | Cross-border data transfer safeguards | No adequacy check for data sent abroad | MEDIUM |
| OFAC, UN, EU Sanctions | Sanctions screening for cross-border payments | No sanctions check in `payment_rails.go` | HIGH |

---

## 10. PRIVACY OPERATIONS & CONSENT

### Gaps (No Evidence of Any Implementation)
| Regulation | Requirement | Gap | Priority |
|---|---|---|---|
| Kenya DPA s24, GDPR Art. 37 | Data Protection Officer (DPO) appointment | No DPO contact in repo or frontend footer | HIGH |
| Kenya DPA s29, GDPR Art. 13 | Privacy policy acceptance on signup | No privacy policy consent in `auth.go:56` (CreateAccount) | HIGH |
| Kenya DPA s29, GDPR Art. 7 | Proof of consent storage (consent ledger) | No consent ledger table in DB | HIGH |
| Kenya DPA s43, GDPR Art. 33 | Breach detection and notification workflow | No breach monitoring in `service.go` | HIGH |
| Kenya DPA s31, GDPR Art. 21 | Opt-out of marketing/commercial use | No marketing opt-out in `account.go` | MEDIUM |

---

## SUMMARY: IMPLEMENTATION STATUS

| Category | ✅ Implemented | ⚠️ Partial | ❌ Missing | Critical Gaps |
|---|---|---|---|---|
| Authentication/Access | 4 | 0 | 5 | MFA, admin audit logs, PII encryption |
| KYC/CDD | 0 | 3 | 6 | Verified ID, sanctions/PEP screening |
| AML/CFT | 0 | 1 | 6 | Transaction monitoring, SAR workflow |
| Data Protection | 1 | 1 | 8 | ODPC registration, DSAR, breach notification |
| PSP Authorization | 1 | 0 | 4 | CBK license, capital adequacy |
| PCI DSS | 1 | 0 | 5 | CHD audit, card data access logs |
| Consumer Protection | 1 | 1 | 4 | Fee disclosures, dispute resolution |
| Admin Audit | 0 | 2 | 4 | Admin audit log table and writes |
| Cross-Border | 0 | 1 | 4 | Source of funds, sanctions screening |
| Privacy Operations | 0 | 0 | 5 | DPO, consent ledger, privacy policy |

**Overall Compliance Score: ~15% (Estimated)**

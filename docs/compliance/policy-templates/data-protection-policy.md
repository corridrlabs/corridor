# Data Protection Policy
## Based on Kenya Data Protection Act 2019, GDPR (EU), and global standards

---

## 1. Purpose
This policy defines how Corridor processes personal data in compliance with:
- Kenya Data Protection Act 2019 (Cap. 411C)
- GDPR (EU) 2016/679 (where applicable)
- Nigeria Data Protection Act 2023 (NDPA)
- South Africa Protection of Personal Information Act (POPIA)

---

## 2. Scope
Applies to all personal data processed by Corridor, including:
- Account data (name, email, phone, country)
- KYC documents (ID, proof of address)
- Transaction data (amounts, beneficiaries, references)
- Technical data (IP addresses, user agents, device info)
- Wallet addresses (Solana public keys)

---

## 3. Data Protection Principles (Kenya DPA s25, GDPR Art. 5)

### 3.1 Lawfulness, Fairness, Transparency
- Inform users via privacy policy before collecting data
- Obtain explicit consent for processing (Kenya DPA s32, GDPR Art. 7)
- Provide clear privacy notices at point of collection

### 3.2 Purpose Limitation
- Collect data only for specified, explicit, legitimate purposes
- Do not process for incompatible purposes without new consent

### 3.3 Data Minimization
- Collect only data necessary for the purpose
- Review data collection forms quarterly for excess fields

### 3.4 Accuracy
- Allow users to update profile data via `/api/accounts/settings`
- Correct inaccurate data within 30 days of request (Kenya DPA s40)

### 3.5 Storage Limitation
- Retain data per retention policies (`data_retention_policies` table)
- Auto-delete non-essential data after retention period
- KYC/transaction data: 7 years (AML requirements)

### 3.6 Integrity and Confidentiality
- Encrypt PII at rest (AES-256)
- TLS 1.2+ for all API endpoints
- Encrypt Solana private keys using `walletKey` (backend/internal/core/service.go:73-84)

### 3.7 Accountability
- Appoint Data Protection Officer (DPO)
- Register with Office of Data Protection Commissioner (Kenya) / Relevant EU authority
- Maintain `consent_ledger` table for proof of consent
- Conduct DPIAs for high-risk processing

---

## 4. Data Subject Rights (Kenya DPA s26, GDPR Art. 15-21)

### 4.1 Right of Access
- Endpoint: `GET /api/compliance/dsars?id=<id>`
- Export endpoint: `GET /api/compliance/export-my-data`
- Provide data in structured, commonly used format (JSON)

### 4.2 Right to Rectification
- Endpoint: `PUT /api/accounts/settings`
- Correct inaccurate data within 30 days

### 4.3 Right to Erasure ("Right to be Forgotten")
- Endpoint: `POST /api/compliance/delete-my-data`
- Grace period: 30 days (for legal holds)
- Anonymize transaction records (keep for AML - POCA s36B)

### 4.4 Right to Data Portability
- Endpoint: `GET /api/compliance/export-my-data`
- Machine-readable format (JSON)

### 4.5 Right to Object
- Endpoint: `POST /api/compliance/consents` (withdraw consent)
- Opt-out of marketing: `{"consent_type": "marketing_communications", "granted": false}`

---

## 5. Cross-Border Data Transfers (Kenya DPA s25(h), GDPR Art. 44-46)

### 5.1 Third-Country Transfers
- Circle (Stripe) - USA: Rely on Standard Contractual Clauses (SCCs)
- Solana blockchain - Public ledger (no personal data on-chain)
- AWS SES - USA: Ensure adequacy or SCCs in place

### 5.2 Safeguards
- Conduct Transfer Impact Assessments (TIA) for high-risk transfers
- Obtain explicit consent for cross-border transfers (`consent_type: "cross_border_transfer"`)

---

## 6. Data Breach Notification (Kenya DPA s43, GDPR Art. 33-34)

### 6.1 Notification Timeline
- ODPC/Regulator: Within 72 hours of becoming aware (Kenya DPA s43(1))
- Data subjects: Without undue delay if high risk to rights (Kenya DPA s43(1)(b))

### 6.2 Breach Response
- Log breach in `system_audit_logs` (action: "data_breach_detected")
- Notify DPO immediately
- Prepare breach notification report (facts, effects, remedial action)
- Maintain breach register for 5 years

---

## 7. DPIA (Data Protection Impact Assessment)

### 7.1 When Required
- New high-risk processing (e.g., biometric KYC, AI profiling)
- Changes to processing that increase risk
- Use of new technologies (e.g., Solana smart contracts)

### 7.2 DPIA Contents
- Description of processing operations
- Assessment of necessity and proportionality
- Risks to data subjects' rights
- Safeguards and mitigation measures

---

## 8. Record of Processing Activities (ROPA)

Maintain ROPA documenting:
- Purposes of processing
- Categories of data subjects and personal data
- Recipients of personal data (Circle, Solana, M-Pesa)
- Retention periods
- Security measures

---

## 9. Data Protection Officer (DPO)

### 9.1 Appointment
- DPO: [Name, Email, Phone]
- Appointed: [Date]
- Publicly listed at: `footer of frontend`, `/api/compliance/dpo-contact`

### 9.2 DPO Responsibilities
- Monitor compliance with Kenya DPA/GDPR
- Advise on DPIAs
- Cooperate with ODPC/regulators
- Handle data subject requests

---

## 10. Compliance Monitoring
- Quarterly review of retention policy compliance
- Annual DPIA review for high-risk processing
- Monthly audit log review (`system_audit_logs`)
- Annual third-party PCI DSS assessment (if processing card data)

---

## 11. Policy Review
- Review: Annually or upon material changes to Kenya DPA/GDPR
- Last reviewed: [Date]
- Next review: [Date + 1 year]

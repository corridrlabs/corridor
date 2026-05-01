# Privacy Operations Manual
## Operational Procedures for Data Protection & Privacy Compliance

---

## 1. Data Subject Requests (DSARs) - Kenya DPA s26, GDPR Art. 15-21

### 1.1 Access Request (GDPR Art. 15)
**Endpoint**: `POST /api/compliance/dsar` with `{"request_type": "ACCESS"}`

**Process**:
1. User submits access request via frontend or API
2. System creates record in `data_subject_requests` (status: PENDING)
3. Compliance team receives notification (email to compliance@corridor.co.ke)
4. Review request within **30 days** (Kenya DPA s26, GDPR Art. 12(3))
5. Generate data export via `GET /api/compliance/export-my-data`
6. Provide data in JSON format (GDPR Art. 20 portability also satisfied)
7. Update `data_subject_requests` status to "COMPLETED"

**Audit**: Log in `system_audit_logs` (action: "dsar_reviewed")

---

### 1.2 Rectification Request (GDPR Art. 16)
**Endpoint**: `POST /api/compliance/dsar` with `{"request_type": "RECTIFICATION", "payload": {"field": "value"}}`

**Process**:
1. User submits rectification request
2. Compliance team verifies inaccuracy (within 30 days)
3. Update account/wallet data via `PUT /api/accounts/settings`
4. Notify user of correction
5. Update `data_subject_requests` status to "COMPLETED"

---

### 1.3 Erasure Request (GDPR Art. 17, "Right to be Forgotten")
**Endpoint**: `POST /api/compliance/dsar` with `{"request_type": "ERASURE"}`

**Process**:
1. User submits erasure request
2. System marks account as `account_status = 'PENDING_DELETION'` (30-day grace period)
3. Compliance team reviews:
   - Any pending transactions? → Hold deletion
   - Any legal obligations to retain? (AML → retain 7 years per POCA s36B)
   - Any disputes? → Hold deletion
4. After grace period:
   - Anonymize transaction records (keep for AML, remove PII)
   - Delete KYC documents (after AML retention)
   - Delete account record
5. Update `data_subject_requests` status to "COMPLETED"

**Audit**: Log in `system_audit_logs` (action: "account_deletion_requested")

---

### 1.4 Data Portability Request (GDPR Art. 20)
**Endpoint**: `GET /api/compliance/export-my-data`

**Process**:
1. User requests export (or submits PORTABILITY DSAR)
2. System calls `core.GetAccountDataExport()`
3. Returns JSON with:
   - Account details
   - Wallet list
   - KYC submissions
   - Consent records
   - Audit logs (last 30 days)
4. User can transmit to another controller (machine-readable JSON)

---

## 2. Consent Management - Kenya DPA s32, GDPR Art. 7

### 2.1 Consent Grant
**Endpoint**: `POST /api/compliance/consents` with `{"consent_type": "terms_of_service", "granted": true}`

**Consent Types**:
- `terms_of_service` - Accept TOS
- `privacy_policy` - Accept Privacy Policy
- `marketing_communications` - Receive marketing emails/SMS
- `data_sharing` - Share data with Circle/M-Pesa/Solana
- `kyc_verification` - Process KYC documents
- `cross_border_transfer` - Transfer data outside Kenya

**Proof of Consent**: Stored in `consent_ledger` table with:
- Timestamp (`granted_at`)
- IP address
- User agent
- Version of policy accepted

---

### 2.2 Consent Withdrawal
**Endpoint**: `POST /api/compliance/consents` with `{"consent_type": "marketing_communications", "granted": false}`

**Process**:
1. Update `consent_ledger` with `withdrawn_at` timestamp
2. Immediately stop processing for withdrawn consent type:
   - Marketing → Remove from email campaigns
   - Data sharing → Stop sharing with third parties
   - Cross-border → Block international transfers
3. Notify user of withdrawal confirmation

**Audit**: Log in `system_audit_logs` (action: "consent_updated")

---

## 3. Data Breach Response - Kenya DPA s43, GDPR Art. 33-34

### 3.1 Breach Detection
**Automated Detection**:
- Failed login attempts >10 in 1 hour → Potential breach
- Unauthorized API access → Log in `system_audit_logs`
- Data export > normal pattern → Flag for review

**Manual Detection**:
- User reports unauthorized access
- Staff notices suspicious activity
- Third-party (Circle/Solana) notifies of breach

---

### 3.2 Breach Assessment (Within 24 hours)
1. **Identify scope**:
   - Which data subjects affected?
   - What types of personal data? (emails, phones, KYC docs, wallet addresses)
   - How many records? (threshold for notification: >500 records)

2. **Risk assessment**:
   - Likelihood of harm (identity theft, financial loss)
   - Severity (KYC docs = high risk, wallet addresses = low risk)

3. **Containment**:
   - Reset affected account passwords
   - Revoke API keys
   - Block suspicious IPs

---

### 3.3 Notification Timeline

#### To Regulator (ODPC Kenya / Relevant EU Authority)
- **Timeline**: Within **72 hours** of becoming aware (Kenya DPA s43(1))
- **Method**: Online portal or email to [ODPC contact]
- **Contents**:
  - Facts relating to breach
  - Effects on data subjects
  - Remedial action taken
  - Contact details for DPO

#### To Data Subjects (if high risk)
- **Timeline**: Without undue delay (Kenya DPA s43(1)(b))
- **Method**: Email + In-app notification
- **Contents**:
  - Description of breach
  - Recommended protective measures (change password, monitor statements)
  - Contact for more information (DPO email)

**Audit**: Log breach in `system_audit_logs` (action: "data_breach_detected")

---

## 4. Cross-Border Data Transfers - Kenya DPA s25(h), GDPR Art. 44-46

### 4.1 Transfer Safeguards
Before transferring data outside Kenya/EU:

1. **Check adequacy decision** (EU → Kenya: No adequacy yet)
2. **Use Standard Contractual Clauses (SCCs)**:
   - Circle (Stripe) - USA: SCCs in place (verify with vendor)
   - Solana - Public blockchain: No personal data on-chain (only public keys)
   - AWS SES - USA: SCCs in place (verify with AWS)

3. **Obtain explicit consent**:
   - Endpoint: `POST /api/compliance/consents` with `{"consent_type": "cross_border_transfer", "granted": true}`
   - Inform user of: Destination country, purpose, safeguards

---

### 4.2 Transfer Log
Maintain `consent_ledger` with:
- Transfer destination (Circle USA, Solana Global, etc.)
- Legal basis (SCCs, consent)
- Date of transfer
- Data categories transferred

---

## 5. DPIA (Data Protection Impact Assessment) - Kenya DPA s31, GDPR Art. 35

### 5.1 When to Conduct DPIA
- New processing of biometric KYC data
- AI profiling for credit scoring
- Large-scale monitoring of users (location tracking)
- Cross-border transfers to high-risk jurisdictions

### 5.2 DPIA Process
1. **Describe processing**: Purpose, data categories, recipients
2. **Assess necessity**: Is all data needed? Can we anonymize?
3. **Identify risks**: To data subjects' rights and freedoms
4. **Mitigation measures**: Encryption, access controls, retention limits
5. **Consult DPO**: Before starting high-risk processing
6. **Review**: Annually or upon material changes

**Template**: Use `docs/compliance/policy-templates/data-protection-policy.md` Section 7.2

---

## 6. Vendor Management (Third-Party Processors) - Kenya DPA s41, GDPR Art. 28

### 6.1 Vendor List
| Vendor | Service | Data Shared | Safeguards |
|---------|---------|-------------|-------------|
| Circle (Stripe) | Card payments, USDC on-ramp | Name, email, amount | SCCs, PCI DSS |
| Solana | Crypto deposits/withdrawals | Wallet address, amount | Public blockchain (no PII) |
| M-Pesa | Mobile money payouts | Phone number, amount | API key auth, TLS |
| AWS SES | Transactional emails | Email, name | SCCs, encryption at rest |

### 6.2 Vendor Due Diligence
Before onboarding vendor:
1. Review privacy policy and security certifications (PCI DSS, ISO 27001)
2. Sign Data Processing Agreement (DPA) with SCCs
3. Verify breach notification procedures (<72 hours)
4. Confirm data deletion upon contract termination

---

## 7. Record of Processing Activities (ROPA) - Kenya DPA s30, GDPR Art. 30

### 7.1 ROPA Template
Maintain in `docs/compliance/ropa.xlsx` or equivalent:

| Purpose | Data Categories | Data Subjects | Recipients | Retention | Safeguards |
|---------|----------------|--------------|------------|-----------|-------------|
| Account management | Name, email, phone | Users | Corridor team | Until account deletion | Encryption, access controls |
| KYC verification | ID docs, selfies | Users | Verify providers (Jumio/etc) | 7 years (AML) | Encryption, restricted access |
| Payment processing | Wallet address, amount | Users | Circle, M-Pesa, Solana | 7 years (AML) | TLS, tokenization |
| Marketing emails | Email, name, preferences | Users | AWS SES | Until consent withdrawn | Opt-out link, consent ledger |

---

## 8. Compliance Monitoring

### 8.1 Daily Checks
- Review `system_audit_logs` for suspicious activity (action: "suspicious_activity_flag")
- Monitor failed login attempts (>10/hour → investigate)
- Check pending DSARs (respond within 30 days)

### 8.2 Monthly Checks
- Run `core.RunRetentionCleanup()` for auto-delete categories
- Review `data_subject_requests` aging report (any >25 days old?)
- Check consent withdrawal trends (any spike in withdrawals?)

### 8.3 Quarterly Checks
- Review retention policy compliance (`data_retention_policies`)
- Update privacy policy (if regulatory changes)
- DPIA review for high-risk processing
- Vendor security certification renewal (PCI DSS, etc.)

### 8.4 Annual Checks
- Full ROPA review and update
- DPO appointment renewal (if needed)
- ODPC registration renewal (Kenya)
- PCI DSS SAQ submission (if processing card data)

---

## 9. Contact Information

### Data Protection Officer (DPO)
- **Name**: [To be appointed]
- **Email**: dpo@corridor.co.ke
- **Phone**: [+254 XXX XXX XXX]
- **Address**: [Physical address]

### Regulatory Authorities
- **Kenya**: Office of Data Protection Commissioner (ODPC) - [https://www.odpc.go.ke](https://www.odpc.go.ke)
- **EU**: Relevant national authority (if operating in EU)
- **Nigeria**: Nigeria Data Protection Commission (NDPC)
- **South Africa**: Information Regulator

---

## 10. Document Control
- **Version**: 1.0
- **Effective Date**: [Date]
- **Last Reviewed**: [Date]
- **Next Review**: [Date + 1 year]
- **Approved By**: [DPO Name]

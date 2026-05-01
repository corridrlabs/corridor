# AML/CFT Policy (Anti-Money Laundering / Combating Financing of Terrorism)
## Based on POCA 2009 (Kenya), FATF Recommendations, and global standards

---

## 1. Purpose
This policy establishes Corridor's AML/CFT framework to:
- Prevent use of Corridor for money laundering or terrorist financing
- Comply with Proceeds of Crime and Anti-Money Laundering Act 2009 (Cap. 59A)
- Meet FATF Recommendation 10 (CDD), 20 (Transaction Monitoring), 19 (SAR Reporting)
- Satisfy regulatory requirements in all operating jurisdictions

---

## 2. Scope
Applies to all Corridor operations:
- Wallet creation and management
- P2P payments and transfers
- EWA (Earned Wage Access) disbursements
- Cross-border remittances (M-Pesa, Stripe, Solana)
- Invoicing and payment links
- Chama (group savings) contributions

---

## 3. Customer Due Diligence (CDD) - FATF Rec 10, POCA s36A

### 3.1 Standard CDD (All Customers)
Collected before allowing payments/transfers:
- Full legal name (as per ID)
- Verified email address
- Phone number (WhatsApp-enabled for M-Pesa)
- Country of residence
- KYC status verification (`kyc_status` in accounts table)

### 3.2 Enhanced Due Diligence (EDD) - FATF Rec 10(d)
Required for:
- PEPs (Politically Exposed Persons)
- High-risk countries (FATF greylist/blacklist)
- Large transactions (>USD 10,000 equivalent)
- Suspicious activity indicators

EDD measures:
- Source of funds verification
- Senior management approval for onboarding
- Enhanced transaction monitoring
- Quarterly review of relationship

### 3.3 Beneficial Ownership - FATF Rec 24, POCA s36A
For corporate accounts:
- Identify beneficial owners (≥25% ownership)
- Verify identity of beneficial owners
- Update beneficial ownership information annually
- Store in `kyc_submissions` with document type "beneficial_ownership"

### 3.4 Sanctions Screening - FATF Rec 12
Screen against:
- UN Security Council sanctions lists
- OFAC (US Treasury) sanctions list
- EU consolidated sanctions list
- Kenya sanctions list (if available)

Integration:
- Stub implemented: `core.SanctionsScreeningStub()` (to integrate WorldCheck/Refinitiv)
- Screen on onboarding (`auth.go:CreateAccount`)
- Screen transactions >USD 1,000 (`core.TransactionMonitoringHook()`)

---

## 4. Transaction Monitoring - FATF Rec 20

### 4.1 Monitoring Rules
Implement automated monitoring for:
- Rapid movement: 3+ transactions in 24 hours (flagged in `system_audit_logs`)
- High-value: Single transaction >USD 10,000
- Structuring: Multiple smaller transactions totaling >USD 10,000 in 7 days
- Round-tripping: Same amount sent to/from same parties
- Cross-border to high-risk jurisdictions

### 4.2 Monitoring Implementation
- Hook: `core.TransactionMonitoringHook()` (called post-transaction)
- Logs suspicious activity to `system_audit_logs` (action: "suspicious_activity_flag")
- Creates draft SAR for compliance team review

---

## 5. Suspicious Activity Reporting (SAR) - FATF Rec 19, POCA s36B

### 5.1 When to File SAR
File SAR with Financial Reporting Centre (FRC) Kenya when:
- Knowledge of suspected money laundering/terrorist financing
- Grounds for suspicion exist
- Transaction monitored as suspicious (per Section 4)

### 5.2 SAR Filing Timeline
- File within 7 days of detection (POCA s36B)
- Use FRC reporting portal or specified form
- Keep copy in `data_subject_requests` (type: "SAR_FILING")

### 5.3 SAR Confidentiality
- Do NOT tip-off customer about SAR filing (POCA s36B(8))
- Restrict access to SAR drafts to compliance team only
- Log SAR access in `system_audit_logs`

---

## 6. Record Keeping - FATF Rec 11, POCA s36B

### 6.1 Retention Periods
- KYC documents: 7 years after account closure (POCA s36B)
- Transaction records: 7 years after transaction (POCA s36B)
- SARs and supporting docs: 7 years from filing
- Audit logs: 7 years (NPSA s20)

### 6.2 Record Security
- Store records in PostgreSQL with access controls
- Encrypt sensitive fields (ID numbers, account balances)
- Restrict access to compliance team only
- Auto-delete after retention period (via `core.RunRetentionCleanup()`)

---

## 7. PEP Screening - FATF Rec 12

### 7.1 Definition
PEP: Individuals entrusted with prominent public functions (e.g., heads of state, judges, senior military officers, SOEs).

### 7.2 PEP Screening Process
- Screen all customers against PEP databases on onboarding
- Re-screen quarterly for changes in PEP status
- Apply EDD to PEPs (Section 3.2)
- Senior management approval required for PEP onboarding

---

## 8. Training and Awareness - FATF Rec 23

### 8.1 Staff Training
- All staff: AML/CFT basics (annual training)
- Customer-facing staff: Red flag recognition (bi-annual)
- Compliance team: Advanced AML/CFT (quarterly updates)

### 8.2 Training Records
- Maintain training attendance logs
- Document training content and assessment results
- Store for 3 years after staff departure

---

## 9. Virtual Assets (Solana) - FATF Rec 15, VASP Act 2025 (Kenya)

### 9.1 VASP Registration
- Register as Virtual Asset Service Provider with CBK (VASP Act s. 12)
- Comply with VASP Act 2025 requirements (Cap. 491B)

### 9.2 Virtual Asset Monitoring
- Monitor Solana transactions for mixing/tumbling patterns
- Flag transactions to/from known high-risk wallets
- Implement travel rule (FATF Rec 16) for VASP-to-VASP transfers

---

## 10. Compliance Team

### 10.1 Roles
- **MLRO (Money Laundering Reporting Officer)**: [Name] - Responsible for SAR filings
- **Compliance Officer**: [Name] - CDD/EDD oversight
- **Sanctions Officer**: [Name] - Sanctions screening and PEP checks

### 10.2 Contact
- Email: compliance@corridor.co.ke
- Phone: [+254 XXX XXX XXX]
- Address: [Physical address for regulatory correspondence]

---

## 11. Policy Review
- Review: Quarterly or upon FATF/regulatory updates
- Last reviewed: [Date]
- Next review: [Date + 3 months]

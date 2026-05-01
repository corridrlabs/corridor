# Kenya Compliance Gap List
## Legal Framework References
- National Payment System Act 2011 (Cap. 491A)
- Data Protection Act 2019 (Cap. 411C)
- Data Protection (General) Regulations 2021 (LN 263/2021)
- National Payment System Regulations 2014 (LN 109/2014)
- Proceeds of Crime and Anti-Money Laundering Act 2009 (Cap. 59A)
- Virtual Asset Service Providers Act 2025 (Cap. 491B)
- Consumer Protection Act 2012 (Cap. 498)

---

## 1. Payment Service Provider Authorization (NPSA s12)
### Legal Requirement
No person shall conduct payment service provider business in Kenya without written authorization from Central Bank of Kenya (CBK) (NPSA s12(1)). Application requires demonstrating financial condition, management character, capital adequacy, and public interest alignment (NPSA s13).

### Current Status
❌ **Non-Compliant**: No evidence of CBK authorization application or approval in repository. No code-level checks for authorized PSP status.

### Gaps
- No CBK PSP license or authorization certificate
- No middleware to restrict unlicensed payment operations
- No capital adequacy or management vetting documentation
- No public interest justification for PSP operations

---

## 2. AML/CFT Program (NPSA s17A, POCA ss. 36A-36C)
### Legal Requirement
Payment service providers are reporting institutions under POCA. Mandatory controls:
- Sanctions screening (UN, OFAC, EU)
- PEP (Politically Exposed Person) screening
- Transaction monitoring for suspicious activity
- Suspicious Activity Reporting (SAR) to Financial Reporting Centre (FRC)
- Beneficial ownership verification (≥25% ownership)
- 5+ year record retention for transactions and KYC

### Current Status
❌ **Non-Compliant**: No AML/CFT program evidence. No sanctions/PEP checks, transaction monitoring, or SAR workflows.

### Gaps
- No sanctions screening integration (e.g., WorldCheck, Sanctions.io)
- No PEP database checks
- No transaction monitoring rules or alert system
- No SAR reporting workflow to FRC
- No beneficial ownership collection/verification
- No AML record retention policy implementation

---

## 3. KYC Verification (NPSA s17A, Data Protection Act s25)
### Legal Requirement
Customer due diligence (CDD) with **verified** identity:
- Government-issued ID verification (biometric or document check)
- Proof of address
- Beneficial ownership declaration for corporate users
- PEP/sanctions check during onboarding

### Current Status
⚠️ **Partially Compliant**: KYC status flag exists (`backend/cmd/api/main.go:456`), but relies on unverified self-reported data.

### Gaps
- No KYC document upload/verification workflow
- No ID biometric or OCR verification
- No beneficial ownership collection for corporate entities
- No PEP/sanctions screening during onboarding
- KYC status is an unverified boolean flag only

---

## 4. Data Protection Compliance (Data Protection Act 2019)
### Legal Requirement
- Register as data controller/processor with Office of Data Protection Commissioner (ODPC) (s18)
- Appoint qualified Data Protection Officer (DPO) (s24)
- Implement data subject rights: access, rectification, erasure, portability (s26)
- 72-hour personal data breach notification to ODPC (s43)
- Cross-border data transfer safeguards (s25(h))
- Data retention limits tied to purpose (s39)

### Current Status
❌ **Non-Compliant**: No ODPC registration, no DPO, no data subject request handling.

### Gaps
- No ODPC registration certificate
- No DPO appointment or public contact details
- No API endpoints for data subject requests (access, delete, port)
- No breach detection or notification workflow
- No cross-border transfer consent or adequacy checks
- No data retention policy enforcing purpose-based deletion

---

## 5. PCI DSS Compliance (If Processing Card Data)
### Legal Requirement
PCI DSS v4.0.1 compliance if storing/processing cardholder data:
- No card data stored in Corridor systems (use tokenization via Circle/Stripe)
- Encrypted data transmission (TLS 1.2+)
- Strict access controls for card data environments
- Quarterly vulnerability scans

### Current Status
❌ **Non-Compliant**: No PCI DSS boundary controls or compliance documentation.

### Gaps
- No card data suppression audit (verify no CHD touches Corridor DB/servers)
- No PCI DSS SAQ (Self-Assessment Questionnaire) or attestation
- No card data access logging
- No TLS enforcement checks for payment endpoints

---

## 6. Consumer Protection (NPSA, Consumer Protection Act)
### Legal Requirement
- Clear fee disclosures before transactions
- Dispute resolution mechanism (≤30 days)
- Refund policies for failed transactions
- Customer funds safeguarding (segregated accounts, not used for operational expenses)

### Current Status
❌ **Non-Compliant**: No dispute handling, fee transparency, or fund safeguarding evidence.

### Gaps
- No dispute resolution API or admin workflow
- No fee schedule endpoint for users
- No customer funds segregation accounting
- No refund workflow for failed payouts
- No terms of service or fee disclosure acceptance

---

## 7. Operational Resilience (NPSA s17)
### Legal Requirement
- Daily reconciliation of customer wallets vs. ledger
- Segregated customer funds vs. company operational accounts
- Admin access audit logs for user/waitlist data
- Incident response plan for payment system outages

### Current Status
⚠️ **Partially Compliant**: Feature gating exists (`backend/cmd/api/main.go:228`, `complianceMiddleware`), but no audit logs or reconciliation.

### Gaps
- No admin audit logging for sensitive data access
- No automated daily reconciliation workflow
- No customer funds safeguarding checks
- No incident response plan for payment outages
- No system uptime monitoring for payment rails

---

## 8. Regulatory Reporting (NPSA s20)
### Legal Requirement
Submit to CBK:
- Monthly transaction volume/value reports
- Suspicious transaction reports (SARs)
- KYC compliance reports
- Respond to CBK information requests within 7 days

### Current Status
❌ **Non-Compliant**: No regulatory reporting workflows or APIs.

### Gaps
- No automated CBK reporting module
- No transaction aggregation for regulatory reports
- No audit trail for CBK information requests

---

## Priority Implementation Order
1. CBK PSP authorization application
2. ODPC data controller registration + DPO appointment
3. KYC document verification workflow
4. AML/CFT program (sanctions screening, transaction monitoring)
5. Data subject rights API + breach notification
6. Admin audit logs + reconciliation
7. PCI DSS boundary audit
8. Consumer protection (disputes, refunds, fund safeguarding)

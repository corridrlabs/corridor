# Security Overview

Corridor is built to move money and sensitive account data, so security is part of the product, not a layer added later. This page explains the practical controls we use to protect accounts, transactions, wallets, compliance data, and administrative actions.

## 1. Security goals

Our security program is designed to:

- Protect customer accounts from unauthorized access
- Protect payment instructions from tampering or replay
- Protect identity, KYC, and financial data from disclosure
- Limit the blast radius of any compromised account or service
- Keep audit trails for investigations and compliance
- Make it hard to bypass controls with direct API calls

Security is not only about blocking attackers. It also includes limiting internal mistakes, controlling privileged access, and making sure risky actions are reviewable.

## 2. Account protection

Every account is protected by authentication and session controls:

- Passwords are hashed before storage
- Authenticated routes require a valid session or bearer token
- Sensitive flows can require onboarding, KYC, and legal acceptance
- Higher-risk operations can be blocked until the profile is complete
- Account lock and status controls can restrict access when risk is detected

We also try to reduce confusion during signup and onboarding so users do not end up creating accounts with missing identity or consent data.

## 3. Identity and KYC controls

Corridor uses KYC as a core security and trust control because payments platforms are routinely targeted for fraud and account abuse.

We may collect or verify:

- Full name
- Email address
- Phone number
- Country
- ID type and ID number
- Business information
- Wallet ownership details

Identity checks may be performed at registration, during onboarding, before payment features, or later if risk changes. If a feature requires verification, the backend should enforce that requirement rather than relying on the frontend alone.

## 4. Session and API protection

We protect API access with layered checks:

- Authenticated endpoints require a valid account session
- Sensitive endpoints require compliance checks
- Feature-gated endpoints require the correct tier or entitlement
- Admin routes require admin authorization
- Rate limiting is used on selected auth and payment routes

This matters because a user should not be able to bypass the UI and call a sensitive endpoint directly if they do not meet the required conditions.

## 5. Data protection

Personal data, KYC material, payment details, and audit records are handled with a minimum-access approach.

Security controls can include:

- Encryption in transit
- Encryption at rest where supported by the storage layer
- Restricted access to sensitive tables and admin views
- Audit logs for privileged actions
- Retention policies for record keeping and cleanup
- Limits on what is exposed in frontend responses

We aim to avoid placing unnecessary personal data in client-side storage, public URLs, logs, or long-lived browser state.

## 6. Payment security

Payments need more than authentication. They also need integrity and fraud controls.

For payment-related requests, we may enforce:

- KYC or profile completion
- Plan or feature entitlement checks
- Balance checks
- Duplicate submission checks
- Transaction audit logging
- Compliance review for higher-risk actions

Where supported, payment flows should be designed so the backend is authoritative. The frontend should guide the user, but the backend must decide.

## 7. Wallet security

Wallet-related data is sensitive and must be treated carefully.

Security principles include:

- Wallet creation should be tied to an authenticated account
- Managed wallet details should not be exposed broadly
- Wallet addresses should be validated before use
- Recovery or reset actions should require strong verification
- Account-level risk checks may block wallet operations temporarily

Wallet setup and wallet usage are separated from general onboarding so the product can control risk more precisely.

## 8. Admin security

Admin access is a privileged capability and should be treated as a separate security domain.

Admin controls include:

- Role-based access control
- Audit logs for admin actions
- Double-approval or review flows for risky actions
- Visibility into waitlists, approvals, and compliance tasks
- Access to feature flags and control switches

Admin users should not be able to silently perform sensitive actions without traceability.

## 9. Monitoring and logging

We use logs and monitoring to detect abnormal behavior and to support investigations.

Useful security signals include:

- Repeated failed logins
- Unexpected changes to profile or payout data
- Suspicious payment patterns
- Rapid account or wallet creation
- Attempts to use locked or disallowed features
- High-risk admin actions

Logs should be useful, but not overexpose secrets or sensitive payloads. A security log should help answer what happened without becoming another data leak.

## 10. Incident response

If we detect a security issue, the response should be fast and documented.

Typical steps:

1. Identify the affected system or account
2. Contain the issue
3. Revoke or rotate credentials if needed
4. Preserve logs and evidence
5. Notify the right internal owners
6. Assess user impact and legal impact
7. Communicate clearly to affected stakeholders

The exact notification timing depends on the incident type and the law in the relevant jurisdiction.

## 11. Operational hardening

Security is also about operational discipline:

- Keep dependencies updated
- Review permissions periodically
- Separate production and development secrets
- Avoid hard-coding credentials
- Restrict direct database access
- Use least privilege for service accounts
- Review new payment and admin features before launch

That discipline is important because many real breaches come from misconfiguration, not from sophisticated attacks.

## 12. User responsibilities

Users also have security responsibilities:

- Use a strong password
- Keep login credentials private
- Review account activity regularly
- Report suspicious behavior quickly
- Use accurate contact details for alerts
- Avoid sharing admin access with unauthorized people

If a user ignores these responsibilities, we may still help, but the risk cannot be fully eliminated from the platform side alone.

## 13. Reporting security issues

If you think you found a vulnerability, send a concise report to our security contact and include:

- What you observed
- The affected page or endpoint
- Steps to reproduce
- Any screenshots, logs, or proof of concept
- How urgent you believe the issue is

We prefer responsible disclosure and good faith reporting. We do not want public exploitation, fake claims, or attempts to abuse the issue before it can be reviewed.

## 14. Security and trust note

No platform can promise perfect safety. Corridor’s goal is to make attacks difficult, make abuse visible, and make recovery possible. We do that by combining product design, backend enforcement, auditability, and operational controls.

## 15. Contact

Security, privacy, and legal notices: <a href="mailto:jamesthaura51@gmail.com">jamesthaura51@gmail.com</a>

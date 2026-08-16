# Security Policy

## Supported Versions

Currently, only the latest active release branch receives security patches and updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

---

## Reporting a Vulnerability

We take the security of **Smart Check-in System (Distribution Academy)** seriously. If you believe you have found a security vulnerability, please do **NOT** open a public issue.

### How to Report:
1. **GitHub Private Vulnerability Reporting (Preferred)**:
   - Navigate to the [Security tab](https://github.com/jfpaardoo/smart-checkin-system/security) of this repository.
   - Click on **Advisories** $\rightarrow$ **Report a vulnerability** to open a private disclosure discussion with the maintainers.
2. **Direct Contact**:
   - Alternatively, you can contact the project maintainers directly via email with the prefix `[SECURITY VULNERABILITY]` in the subject.

### What to Include in Your Report:
- A detailed description of the vulnerability and its potential impact.
- Step-by-step instructions or Proof of Concept (PoC) to reproduce the issue.
- Relevant logs, request/response headers, or code snippets.
- Any suggestions for remediation or mitigation.

---

## Response Timeline & Process

- **Initial Acknowledgment**: Within 48–72 hours of receiving your report.
- **Triage & Assessment**: We will assess the severity and impact, verifying the findings.
- **Remediation & Patching**: A security fix will be prepared, tested, and released.
- **Public Disclosure**: Once the fix is released, a GitHub Security Advisory (GHSA) will be published with proper credit attributed to the reporter (unless you prefer to remain anonymous).

---

## Security Practices Implemented

- **Authentication & Authorization**: Stateless JWT with secure HTTP-only cookies, WebAuthn / Passkeys, and Role-Based Access Control (RBAC).
- **Two-Factor Authentication (2FA)**: Time-based One-Time Password (TOTP) support with encrypted secrets.
- **Audit Logging**: Cryptographic tamper-evident hash chaining (SHA-256 + HMAC) for audit trails.
- **Automated Scanning**: Continuous CI/CD security scanning using CodeQL, Trivy, Gitleaks, and Dependabot.

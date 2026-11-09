# Security Policy

PeopleOS handles workforce records, attendance logs, and personal leave information. Security, data privacy, and access control are fundamental to its architecture.

---

## Supported Versions

Only the current active release line receives security updates.

| Version | Supported          |
| :------ | :----------------- |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Security Architecture & Controls

### 1. Authentication & Session Security
- **Engine**: Powered by Auth.js / NextAuth.js v5 with credential and demo provider adapters.
- **Password Storage**: Passwords are cryptographically hashed using `bcryptjs` with salt rounds prior to persistence.
- **Session Protection**: Authenticated sessions are validated server-side on every protected API call and layout render. Client-provided tokens or IDs are never trusted blindly.
- **Cookie Security**: Secure, HTTP-only, SameSite session cookies prevent client-side script interception (XSS).

### 2. Authorization & Role-Based Access Control (RBAC)
- **Roles**: Enforces three explicit access tiers:
  - `ADMIN`: Full management capability over personnel records, attendance logs, leave approvals, and system settings.
  - `EMPLOYEE`: Access strictly confined to own profile, personal attendance history, and personal leave requests.
  - `DEMO_VIEWER`: Read-only simulated mode with destructive and write mutations blocked.
- **Server-Side Enforcement**: Role authorization is validated on the server within API route handlers and server actions. UI conditional rendering is treated as a usability enhancement, not a security boundary.
- **Resource Ownership**: Endpoints verify that the authenticated employee ID matches the target resource being requested or mutated.

### 3. Database & Query Safety
- **ORM & Injection Prevention**: All database access is mediated through Prisma ORM with parameterized queries, preventing SQL injection vulnerabilities.
- **Connection Isolation**: The PostgreSQL connection string (`DATABASE_URL`) is strictly confined to server-side execution and is never bundled in client assets.
- **Relational Integrity**: Foreign key constraints and transaction boundaries ensure ACID compliance for multi-table updates (e.g. leave quotas and attendance audits).

### 4. Input Validation & Business Logic Integrity
- **Boundary Validation**: Request payloads (dates, strings, enums, quotas) are validated server-side prior to processing.
- **State Machine Integrity**: Status transitions for leave requests (Pending → Approved / Rejected / Cancelled) are strictly guarded against invalid state jumps.
- **Concurrency & Duplication Protection**: Overlapping leave applications for identical date ranges are detected and rejected at the service layer.

### 5. Secrets & Environment Configuration
- **Isolation**: Production secrets (`AUTH_SECRET`, `DATABASE_URL`) must be supplied via secure environment variables.
- **Version Control**: Environment files containing real secrets (`.env`, `.env.local`) are excluded from Git via `.gitignore`. An example template (`.env.example`) provides sanitised placeholders.

---

## Reporting a Vulnerability

If you discover a security vulnerability in PeopleOS, please disclose it responsibly. Do not publish or discuss potential vulnerabilities in public issue trackers.

### How to Report

Please email a detailed vulnerability report privately to the repository maintainer or open a private GitHub Security Advisory.

Include the following information:
1. **Description**: Nature and potential impact of the vulnerability.
2. **Steps to Reproduce**: Detailed step-by-step instructions or proof-of-concept code.
3. **Affected Endpoints/Components**: Affected routes, APIs, or files.
4. **Proposed Fix**: Any suggested mitigations or patches (optional).

### Response Process

- **Acknowledgment**: You will receive an acknowledgment within 48 hours.
- **Assessment**: The maintainer will investigate and determine the severity and scope.
- **Resolution**: A patch will be developed, tested, and deployed, followed by public acknowledgment if desired.

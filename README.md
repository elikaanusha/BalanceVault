# BalanceVault — Money Movement with a Ledger You Can Prove

> A secure account management platform with role-based access, user onboarding, and auditable account operations.

---

## 📌 The Problem

Managing financial accounts and their associated operations requires much more than simply storing balances in a database table. Real-world financial infrastructure demands:
- **Strictly Controlled Access:** Multi-role separation between account holders, risk officers/auditors, and platform administrators.
- **Auditable Integrity:** Mathematical proof that ledger records and transactions cannot be modified, deleted, or inserted out-of-order retrospectively.
- **Structured Onboarding:** Formal compliance, identity verification (KYC), and administrative approval workflows prior to granting money movement capabilities.
- **Accountability for Sensitive Actions:** Tamper-evident audit logs with cryptographic checksums tracking every balance change, status alteration, and authentication event.

**BalanceVault** is engineered to unify these capabilities into a single, cohesive, and resilient platform.

---

## 🏗️ Architecture & What Was Built

```
                          ┌────────────────────────┐
                          │   React 18 Frontend    │
                          │   (Vite + Dashboard)   │
                          └───────────┬────────────┘
                                      │ REST APIs / JWT
                                      ▼
                          ┌────────────────────────┐
                          │  Express.js API Server │
                          │  + RBAC & Rate Limiter │
                          └─────┬────────────┬─────┘
                                │            │
           ┌────────────────────┴──┐      ┌──┴─────────────────────┐
           │ Redis / Cache Limiter │      │ Provable Ledger Engine │
           │ (DDoS & Brute Force)  │      │ (SHA-256 Hash Chained) │
           └───────────────────────┘      └──────────┬─────────────┘
                                                     │
                                          ┌──────────┴─────────────┐
                                          │  PostgreSQL (Prisma)   │
                                          │  Role Separation Model │
                                          └────────────────────────┘
```

The system comprises:

1. **Modern React Frontend:**
   - Account Holder Dashboard: Multi-account view (Checking, Savings, Escrow), live balances, deposit funding, and peer-to-peer transfers.
   - Live Cryptographic Ledger Explorer: Interactive view of transaction blocks, previous hash links, and current head hash.
   - Onboarding KYC Application: Business entity details, registration numbers, and identity documents submission.
   - Admin & Audit Command Center: User management, status toggles (`ACTIVE` / `SUSPENDED`), onboarding approval queues, and one-click cryptographic ledger verification.
   - First-Admin Bootstrap Wizard: Guided interface to initialize the first administrator and verify credentials.

2. **Node.js / Express Backend:**
   - Health (`/api/health`) and Readiness (`/api/ready`) probes inspecting database, memory, and rate limiter status.
   - Distributed Rate Limiter: Redis-backed rate limiting with seamless high-speed in-memory fallback.
   - Role-Based Access Control (RBAC): Enforces permissions across `ADMIN`, `AUDITOR`, and `ACCOUNT_HOLDER` identities.

3. **Provable Ledger Chaining (SHA-256):**
   - Every transaction computes:
     $$\text{ledgerHash} = \text{SHA-256}(\text{previousHash} \parallel \text{fromAccountId} \parallel \text{toAccountId} \parallel \text{amount} \parallel \text{currency} \parallel \text{timestamp} \parallel \text{type} \parallel \text{reference})$$
   - Formally links the entire transaction history from the `GENESIS_BLOCK` to the head hash. Any retrospective database modification invalidates subsequent blocks.

4. **PostgreSQL Role Separation & First-Admin Bootstrap:**
   - Resolves cloud permission rejections (**Neon SQLSTATE 42501**) using pre-granted role membership (`bootstrap_operator`), `SET ROLE`, and a `SECURITY DEFINER` stored procedure (`fn_bootstrap_first_admin`).

---

## 🔒 Database Roles & Overcoming SQLSTATE 42501

### What the AI Got Wrong and What I Fixed Myself
During deployment to hosted PostgreSQL environments (such as Neon), AI tools initially suggested changing role passwords or altering permissions using the project-owner connection. Neon rejected these commands with:
```
ERROR: 42501: must be superuser to alter superusers / cloud roles
```

### The Architectural Solution
By inspecting the actual PostgreSQL catalog and privilege matrices, the proper pattern was established:
1. The bootstrap operator login possesses membership in the `bootstrap_operator` role.
2. The membership allows explicit `SET ROLE bootstrap_operator`.
3. The schema owner provides a stored procedure `fn_bootstrap_first_admin` marked as `SECURITY DEFINER`.
4. The bootstrap function executes with elevated privilege safely, guarded by an idempotency check (`COUNT(ADMIN) = 0`) to prevent multi-execution or takeover.

The complete SQL implementation is located at [`scripts/setup-db-roles.sql`](file:///c:/Users/elika/OneDrive/Desktop/snovasys/scripts/setup-db-roles.sql).

---

## 🚀 How to Run It

### 1. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm --prefix frontend install
```

### 2. Configure Environment
Create `.env` (or copy `.env.example`):
```bash
cp .env.example .env
```

### 3. Database Preparation
Generate Prisma client and apply database migrations:
```bash
# Generate Prisma Client
npm run db:generate

# Apply migrations / push schema
npm run db:migrate
```

### 4. Bootstrap First Administrator
Execute the secure bootstrap utility:
```bash
npm run bootstrap:admin
```
*Creates the primary administrator (`admin@balancevault.internal` / `AdminVault2026!Secure`), tests login immediately, and records an immutable audit log.*

### 5. Automated End-to-End Verification
Run the comprehensive test suite verifying health probes, bootstrap idempotency, registration, onboarding approval, money movements, and hash chain integrity:
```bash
npm run verify
```

### 6. Start the Development Servers
```bash
npm run dev
```
- **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Health Endpoint:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Readiness Probe:** [http://localhost:5000/api/ready](http://localhost:5000/api/ready)

---

## 🤖 AI Tools Used & Human Oversight

- **ChatGPT:** Technical architecture exploration, schema design discussion, and deployment troubleshooting.
- **OpenAI Codex in VS Code:** Initial code implementation and boilerplate generation.
- **Human Engineering & Corrections:** Diagnosed PostgreSQL role boundaries, fixed cloud SQLSTATE 42501 permission bugs, constructed the SHA-256 provable ledger verification engine, and engineered resilient storage fallbacks.

---

## ✅ Completed & Verified Work

- [x] First-admin bootstrap process completed and verified against role separation model.
- [x] End-to-end admin authentication and JWT lifecycle verified.
- [x] Account-holder registration and KYC onboarding submission workflow verified.
- [x] Admin onboarding review, user status toggles (`ACTIVE` / `SUSPENDED`), and account provisioning.
- [x] Provable ledger money movement (deposits and inter-account transfers) with SHA-256 hash chaining.
- [x] Cryptographic ledger integrity verification check (`verifyLedgerIntegrity`).
- [x] Tamper-evident audit trail with deterministic checksum calculations.
- [x] Automated test suite (`scripts/verify-system.js`) passing all 11 verification checks.
- [x] Interactive browser frontend for account holders and administrators.

---

## ⚠️ Hackathon Disclaimer

*BalanceVault is developed as a hackathon and technical evaluation demonstration utilizing synthetic demo funds and mock identity verification. It is not intended for real-world money transmission or commercial financial custody without regulated banking licenses.*


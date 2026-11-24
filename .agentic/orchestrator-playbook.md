# Eksporflow Orchestration Playbook

This standard operating procedure (SOP) defines how the **Lead Orchestrator (Antigravity)** coordinates the autonomous engineering squad to build and maintain Eksporflow.

---

## 1. Request Intake & RFC Formulation

When a user asks for a feature, bug fix, or optimization:
1. **Analyze Requirements**: Map the request to affected modules (Database, Backend API, Frontend UI, Document Exporter, Trade Regulations).
2. **Draft Feature RFC**: Create an implementation plan specifying:
   - Shared interfaces & Zod schemas.
   - Database tables / migrations (if applicable).
   - tRPC procedures.
   - UI views & user interaction flow.
   - Acceptance criteria & test cases.

---

## 2. Agent Dispatch Protocols

The Lead Orchestrator dispatches work according to domain ownership:

| Module / Layer | Primary Agent | Supporting Agent | Quality Validator |
| :--- | :--- | :--- | :--- |
| **Data Contracts & Schemas** | `@architect` | `@backend-dba` | `@qa-auditor` |
| **Database & API Endpoints** | `@backend-dba` | `@architect` | `@qa-auditor` |
| **Trade Intelligence & AI Guardrails** | `@compliance-ai` | `@backend-dba` | `@qa-auditor` |
| **Institutional Document Exporters** | `@doc-specialist` | `@architect` | `@qa-auditor` |
| **Client UI/UX & Flow** | `@ui-ux-engineer` | `@compliance-ai` | `@qa-auditor` |

---

## 3. Strict Verification & Quality Gate (The QA Hand-Off)

Before any commit is made:
1. **TypeScript Type Check**:
   ```bash
   node node_modules\typescript\bin\tsc --noEmit
   ```
   *Requirement*: 0 errors.

2. **Vitest Unit & Contract Suite**:
   ```bash
   node node_modules\vitest\vitest.mjs run
   ```
   *Requirement*: 100% test files passed (currently 20/20 files, 95/95 tests).

3. **Vite Production Bundle Verification**:
   ```bash
   node node_modules\vite\bin\vite.js build
   ```
   *Requirement*: Zero unresolved imports, exit code 0.

4. **Server esbuild Bundle Check**:
   ```bash
   node node_modules\esbuild\bin\esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
   ```
   *Requirement*: Bundle generated in `dist/index.js`, exit code 0.

---

## 4. Git Atomic Commit Standard

Commit directly to `main` with semantic conventional commit messages:
```bash
git add .
git commit -m "<type>(v2): <concise summary of changes>"
```
Examples:
- `feat(v2): tahap 3 - institutional multi-item document engine with immutable audit snapshots`
- `feat(v2): tahap 4 - bespoke industrial UI/UX, 4-step onboarding wizard, and production hardening`
- `fix(v2): resolve browser crypto stub alias in vite production build`

# Belarro v3 — Operations Standard

**Version:** 1.0  
**Date:** May 24, 2026  
**Status:** Active  
**Owner:** Ron Ben-Yohanan (Product), Backend Dev, Frontend Dev

---

## OPERATIONAL FRAMEWORK

This document captures how we work. Professional team. Industry standards. Every decision documented.

---

## 1. DEVELOPMENT PROCESS

### Code Ownership
- **Backend:** Node.js + Express + Prisma + PostgreSQL
- **Frontend:** Next.js + React + TypeScript + Tailwind
- **Database:** PostgreSQL on Railway
- **Deployment:** Vercel (frontend) + Railway (backend)

### Repository Structure
```
belarro-v3/
├── backend/          (Node.js API)
├── frontend/         (Next.js web app)
├── docs/             (Architecture, design, runbooks)
├── OPERATIONS_STANDARD.md
└── README.md
```

### Git Workflow
1. **Main branch:** Production-ready code only. Protected. No direct commits.
2. **Develop branch:** Integration point. All features merged here first.
3. **Feature branches:** `feature/[task-id]` per developer task.
4. **Naming:** `feature/task-1-1-database-setup` or `bugfix/seed-inventory-deduction`

### Commit Standards
- **Message format:** `Task ID: what changed and why`
- **Example:** `Task 1.1: Create Prisma schema for crops, variants, orders`
- **Never:** commit `.env`, secrets, or sensitive data
- **Always:** reference task ID in message

### Code Review Process
- **Trigger:** Pull Request to develop branch
- **Reviewers:** 1 approval required (from person who didn't write code)
- **SLA:** Review within 24 hours
- **Merge:** Only after approval + tests passing
- **Conflict resolution:** Author resolves conflicts, re-review

---

## 2. QUALITY STANDARDS

### Code Quality Gates (Must Pass Before Merge)

| Gate | Tool | Command | Threshold |
|------|------|---------|-----------|
| Linting | ESLint | `npm run lint` | 0 errors |
| Type Check | TypeScript | `npm run type-check` | 0 errors |
| Unit Tests | Jest | `npm test -- --coverage` | >80% coverage, all pass |
| Formatting | Prettier | `npm run format` | Auto-fix, no diff |
| Security | npm audit | `npm audit` | 0 critical/high |

### Definition of Done
**Code is "done" when:**
- ✅ Feature implemented per spec
- ✅ Unit tests written (>80% coverage)
- ✅ Tests passing (`npm test`)
- ✅ TypeScript strict (no `any` types)
- ✅ Linting passing (`npm run lint`)
- ✅ Code reviewed + approved
- ✅ Manual E2E test done
- ✅ Merged to develop branch

**Feature is "done done" when:**
- ✅ Deployed to staging
- ✅ You manually tested on staging
- ✅ Deployed to production
- ✅ Monitoring shows no errors (24h)

---

## 3. DAILY OPERATIONS

### Standup (9am Daily, 15 min)
**Format:** Slack thread + optional voice call

**Each person says:**
1. What I shipped yesterday
2. What I'm doing today
3. Blockers (if any)

### Weekly Demo (Friday 4pm, 30 min)
**Attendees:** Ron, backend dev, frontend dev

**What to show:**
- Features completed this week (live demo)
- Tests passing (show coverage report)
- Feedback needed for next week

### Retro (End of sprint, 1 hour)
**Questions:**
1. What went well?
2. What was hard?
3. What should we do differently?

---

## 4. DEPLOYMENT PROCESS

### Staging Deployment
1. Merge to develop branch
2. Tests passing, code reviewed
3. Deploy to Railway staging + Vercel staging
4. You: Manual E2E test
5. Approve: "Ready for production"

### Production Deployment
1. Staging tested + approved
2. Backup taken
3. Deploy to Railway production + Vercel production
4. You: Health check (can you use the system?)
5. Monitor: First 2 hours (check logs)
6. Sign off: "Production stable"

**Rollback (if critical issue):**
- Revert commit, redeploy immediately

---

## 5. TESTING STANDARDS

### Unit Tests (Backend + Frontend)
- **Target:** >80% coverage
- **Tool:** Jest + TypeScript
- **Run:** `npm test`

### Integration Tests (API + Database)
- **Coverage:** Critical workflows
- **Run:** `npm run test:integration`

### E2E Tests (Manual)
- **Frequency:** Weekly
- **Coverage:** Order → seed → harvest → deliver workflow
- **Proof:** Screenshots/video

---

## 6. MONITORING & ALERTING

### Production Monitoring
- **Error tracking:** Sentry (auto-alerts on critical errors)
- **Logging:** Railway + Vercel logs (searchable)
- **Uptime:** Health endpoint every 5 min
- **Target:** 99%+ uptime

### Post-Incident
1. Alert received → check logs
2. Root cause identified
3. Fix deployed
4. Post-mortem written + shared

---

## 7. DOCUMENTATION STANDARDS

### Code Documentation
- **Obvious code:** No comments
- **Complex logic:** Inline comment explaining WHY
- **APIs:** Documented in Technical Design Doc
- **Database:** Schema documented (migrations explain changes)

### Runbooks
- Database backup/restore
- Deploy rollback
- Customer onboarding
- Troubleshooting

---

## 8. TEAM ACCOUNTABILITY

### Ron (Product/QA)
- Decisions: Scope, priority, timeline
- Testing: Manual E2E, customer feedback
- Sign-off: "Ready for production"

### Backend Dev
- Deliverables: API endpoints, database, business logic
- Quality: >80% tests, secure, <500ms response
- Responsibility: System is correct, secure, fast

### Frontend Dev
- Deliverables: UI screens, forms, dashboards
- Quality: TypeScript strict, responsive, accessible
- Responsibility: System is usable, beautiful

---

## 9. PROFESSIONAL STANDARDS (NON-NEGOTIABLE)

1. **No apologies.** Fix it, move on.
2. **No secrets in git.** .env never committed.
3. **No shortcuts.** Tests before merge. Always.
4. **No "maybe it works."** Real E2E proof. Always.
5. **No hero mode.** Sustainable pace.
6. **No cowboy deploys.** Process, checklist, approval.
7. **No blaming tools/people.** "We" fix it.

---

## 10. COMMUNICATION

### Synchronous
- **Slack:** Quick questions, blockers
- **Voice/Video:** Complex issues, reviews
- **Daily standup:** 9am (15 min)
- **Weekly demo:** Friday 4pm (30 min)

### Asynchronous
- **GitHub issues:** Tasks, bugs
- **Git commits:** What changed + why
- **Shared docs:** Decisions, learnings

### Response SLA
- **Critical blocker:** 1 hour
- **Code review:** 24 hours
- **Regular question:** 4 hours

---

## 11. METRICS & TRACKING

### Per Developer (Weekly)
- Tasks completed
- Test coverage
- Code review feedback
- Bugs found post-deploy

### Per Sprint
- Velocity
- Quality (bugs/1000 LOC)
- Deploy frequency
- Lead time (commit → production)
- Uptime

### Targets
- Velocity: 80% of estimate
- Quality: <1 bug/1000 LOC
- Deploy: 1-2x/week
- Lead time: <24h
- Uptime: 99%+

---

## 12. INCIDENT RESPONSE

### Critical (Production Down)
1. Revert last deployment
2. Alert team
3. Restore service
4. Monitor 2 hours

### Major (Feature Broken, Data Corruption)
1. Identify root cause
2. Quarantine damage
3. Fix + deploy
4. Monitor 24h

### Minor (UI bug, typo)
1. Log issue
2. Fix in next deploy

---

**THIS IS YOUR OPERATING SYSTEM**

Every decision from here follows this standard.

Professional team. Professional results.

Let's ship.

---

**Version:** 1.0  
**Date:** May 24, 2026  
**Next Review:** June 1, 2026

# Belarro v3 Security Checklist

**Status:** Pre-Production Review  
**Last Updated:** 2026-05-24  
**Version:** 1.0

---

## Authentication & Authorization

- ✅ **JWT Token Parsing** — Parses Authorization header in format `Bearer <user_id>:<role>`
- ✅ **Role-Based Access Control** — Three roles enforced: `admin`, `customer`, `chef`
- ✅ **Role Validation** — Invalid roles rejected with 401
- ✅ **Customer Data Isolation** — Customers can only access their own data via `requireCustomerOwnership` middleware
- ✅ **Admin-Only Endpoints** — Invoice and Standing Order creation protected with `requireAdmin` middleware
- ✅ **Development Mode** — Allows unauthenticated requests for testing (assumes admin role)
- ⚠️ **Production Mode** — Must be enabled via `NODE_ENV=production` before deployment

### Production Requirements:
- [ ] Replace mock JWT parsing with real JWT library (e.g., `jsonwebtoken`)
- [ ] Implement RS256 or HS256 signature verification
- [ ] Add token expiration validation
- [ ] Store private signing keys in secure vault (not in code/config)
- [ ] Rotate signing keys regularly

---

## Input Validation

- ✅ **Invoice Month Format** — Validates `YYYY-MM` format with regex
- ✅ **Month Range** — Enforces months 01-12
- ✅ **Year Range** — Restricts to ±5 years from current year
- ✅ **Standing Order Items** — Validates 1-100 items per order
- ✅ **Quantity Bounds** — Enforces 1-10,000 per item
- ✅ **Price Bounds** — Restricts €0-€10,000 per item
- ✅ **Delivery Day** — Validates 0-6 (Monday-Sunday)
- ✅ **Pagination** — Limits page size to max 100 items
- ✅ **No Raw SQL** — All queries use Prisma ORM (SQL injection safe)

---

## Data Protection

- ✅ **Cascade Deletes** — Orphaned records automatically deleted (Order → OrderFulfillment, Standing Order → Items)
- ✅ **Duplicate Prevention** — Unique constraint on `(customer_id, invoice_month)` prevents duplicate invoices
- ✅ **No Hardcoded Secrets** — API keys, passwords not found in codebase
- ✅ **Transactional Writes** — Standing order creation uses database transactions for consistency

### Checklist:
- [ ] All `.env*` files excluded from git (check `.gitignore`)
- [ ] Database credentials stored in environment variables only
- [ ] Connection strings use principle of least privilege (separate read/write users if possible)
- [ ] Regular backups enabled for production database
- [ ] Backup encryption enabled

---

## API Security

- ✅ **Error Handling** — Generic error messages (no stack traces leaked in responses)
- ✅ **HTTPS Ready** — Backend serves JSON, frontend should proxy via HTTPS in production
- ⚠️ **CORS** — Currently wide open (`app.use(cors())`). Must be restricted in production.
- ⚠️ **Rate Limiting** — Not yet implemented (noted in API_DOCUMENTATION.md as future)

### Production Requirements:
- [ ] Enable CORS whitelist: `cors({ origin: process.env.ALLOWED_ORIGINS })`
- [ ] Set Allowed Origins to specific domains (e.g., `https://app.example.com`)
- [ ] Implement rate limiting middleware (e.g., `express-rate-limit`)
  - 100 requests/minute for authenticated users
  - 10 requests/minute for unauthenticated users
- [ ] Set security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` (if not embedded)
  - `Strict-Transport-Security: max-age=31536000` (if HTTPS)
- [ ] Enable request size limits (`app.use(express.json({ limit: '10mb' }))`)

---

## Database Security

- ✅ **Prisma Client** — Type-safe ORM prevents SQL injection
- ✅ **Relation Validation** — All foreign keys validated before operations
- ✅ **Cascade Deletes** — Properly configured in schema

### Production Requirements:
- [ ] Use parameterized queries only (no string interpolation)
- [ ] Enable database encryption at rest
- [ ] Enable SSL/TLS for database connections
- [ ] Use read-only replicas for reporting queries if needed
- [ ] Set database connection timeouts and retry policies
- [ ] Monitor slow queries (queries taking >5s)

---

## Operational Security

- ✅ **Error Logging** — Errors logged to console (redirected to file in production)
- ✅ **Health Check** — Liveness endpoint available at `/health`

### Production Requirements:
- [ ] Configure centralized logging (e.g., CloudWatch, Datadog, ELK)
- [ ] Set up monitoring for:
  - Error rates (alert if >1% of requests fail)
  - Response time P99 (alert if >500ms)
  - Database connection pool exhaustion
  - Memory usage (alert if >80% of available)
- [ ] Set up alerting for:
  - Auth failures (>10 failed login attempts)
  - API endpoint errors (5xx responses)
  - Database connectivity issues
- [ ] Enable audit logging for:
  - Invoice generation
  - Standing order creation/deletion
  - Admin-level operations
- [ ] Configure automatic backups with point-in-time recovery

---

## Frontend Security

- ✅ **No Direct HTML Injection** — API returns JSON only
- ✅ **TypeScript Strict Mode** — Type safety enforced

### Production Requirements:
- [ ] Content Security Policy headers on frontend server
- [ ] XSS prevention via output encoding
- [ ] CSRF token validation on state-changing operations
- [ ] Secure cookie flags: `HttpOnly`, `Secure`, `SameSite=Strict`
- [ ] Regular dependency updates (`npm audit fix`)

---

## Incident Response

- [ ] Create incident response playbook
- [ ] Document rollback procedures
- [ ] Set up on-call rotation
- [ ] Define escalation paths
- [ ] Test disaster recovery quarterly

---

## Compliance

### GDPR (if applicable)
- [ ] Data deletion request handler (GDPR Article 17 - Right to be forgotten)
- [ ] Data export handler (GDPR Article 20 - Data portability)
- [ ] Privacy policy linked from login page
- [ ] Terms of service agreed before signup

### Financial Regulations (German Hausverwaltung context)
- [ ] Invoice retention policy (7+ years required in Germany)
- [ ] Audit trail for invoice modifications
- [ ] VAT calculation validation for 19% German VAT
- [ ] Double-entry bookkeeping principles enforced

---

## Testing & Validation

- ✅ **Unit Tests** — Invoice calculations verified
- ✅ **Integration Tests** — Full workflows tested (customer → standing order → invoice)
- ✅ **Input Validation Tests** — Edge cases covered (invalid months, out-of-range quantities, etc.)
- ⚠️ **Security Tests** — Basic auth and data isolation tested, but missing:
  - [ ] Penetration testing by external firm
  - [ ] Automated security scanning (SAST, DAST)
  - [ ] API fuzzing (random input generation)
  - [ ] Load testing with security payloads

---

## Sign-Off

- **Reviewed By:** [Pending]
- **Approved By:** [Pending]
- **Last Security Audit:** 2026-05-24
- **Next Audit Due:** 2026-08-24 (quarterly)

---

## Notes

**Development Status:** Production MVP  
**Known Limitations:**
- Rate limiting not yet implemented
- CORS not yet restricted to specific domains
- JWT token validation is mock (accepts any format `<user>:<role>`)
- No token expiration or refresh mechanism

**Next Steps for Production:**
1. Implement real JWT signing/validation
2. Add rate limiting middleware
3. Restrict CORS to whitelisted domains
4. Enable HTTPS with valid SSL certificate
5. Set up centralized logging and monitoring
6. Run penetration test
7. Complete compliance audit for GDPR + German financial regulations

# Security Audit - Belarro v3

## 1. Authentication & Authorization

**Status:** ⚠️ TODO - Not yet implemented
- [ ] JWT or session-based authentication required
- [ ] Role-based access control (RBAC)
- [ ] Customer data isolation (customers can only see own data)

**Recommendation:** Add authentication middleware before production:
```typescript
// src/middleware/auth.ts
- Extract JWT token from Authorization header
- Validate against secret key
- Attach user to request context
- Enforce role checks on sensitive endpoints
```

## 2. Input Validation

**Status:** ✅ IMPLEMENTED

All user inputs are validated:
- Required field checks (crops.ts:106, variants.ts:84, customers.ts:94)
- Numeric field positivity checks (crops.ts:122, variants.ts:91, orders.ts:157)
- Enum validation (seeding_schedule must be TUESDAY|FRIDAY)
- Email format validation needed for customers (customers.ts)

**Verified Endpoints:**
- POST /crops: requires name_en, name_de, seeds_per_tray, yield_per_tray, total_growth_days, seeding_schedule
- POST /variants: requires crop_id, size_name, size_grams, price_eur
- POST /orders: requires customer_id, product_variant_id, quantity
- POST /customers: requires name, email, address, city

## 3. Data Isolation

**Status:** ⚠️ PARTIAL - Needs auth

Without authentication, all customers can access all data. With auth:
- Customers can only access own orders and follow-ups
- Crops and inventory are admin-only
- Implement via middleware checking JWT claims

## 4. SQL Injection Prevention

**Status:** ✅ IMPLEMENTED

Prisma ORM prevents SQL injection:
- No raw SQL queries in routes
- All queries use Prisma Client with parameterized inputs
- No string concatenation in where clauses

**Verified:**
- crops.ts uses `where: { status: status as string }` (safe)
- customers.ts uses `where: { status: status as string }` (safe)
- All findUnique/findMany use Prisma queries

## 5. XSS Prevention

**Status:** ✅ IMPLEMENTED

- Frontend uses React/Next.js which auto-escapes template output
- No dangerouslySetInnerHTML in components
- API returns JSON, not HTML

## 6. CSRF Protection

**Status:** ⚠️ TODO - Add CSRF middleware

**Recommendation:**
```typescript
import csrf from 'csurf';
app.use(csrf());
// Return token in response headers
// Client includes token in POST/PUT/DELETE requests
```

## 7. Rate Limiting

**Status:** ⚠️ TODO - Add rate limiting middleware

**Recommendation:**
```typescript
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

## 8. Secrets & Credentials

**Status:** ✅ VERIFIED

- DATABASE_URL is environment-only (never in code)
- No API keys hardcoded
- .env files in .gitignore

**Files checked:**
- All routes access prisma from shared export (index.ts)
- No credentials in code comments
- No tokens in request bodies

## 9. Error Handling

**Status:** ✅ IMPLEMENTED

- Global error handler (index.ts:42-58)
- ApiError class with standardized response format
- Sensitive errors are not exposed to clients
- Example: "An unexpected error occurred" instead of stack traces

## 10. Cascade Deletes

**Status:** ✅ IMPLEMENTED

Verified cascade deletes in schema:
- Crop deletion cascades to ProductVariant, SeedingBatch, SeedInventory, SampleInventory
- Customer deletion cascades to Order, Visit, FollowUp
- ProductVariant deletion cascades to Order, PackageInventory
- Prevents orphaned records

## 11. Transaction Safety

**Status:** ✅ IMPLEMENTED

Critical operations are transactional:
- Customer creation + follow-up generation (customers.ts:45-67)
- Seeding batch creation + inventory deduction (seeding-harvest.ts:58-85)
- Harvest recording + sample inventory update (seeding-harvest.ts:245-265)

## 12. Data Validation at Boundaries

**Status:** ✅ IMPLEMENTED

Only system boundaries (user input, external APIs) require validation:
- Request bodies are validated before processing
- Internal operations trust framework guarantees
- No over-validation of internal data

## 13. Logging & Monitoring

**Status:** ⚠️ TODO - Add structured logging

**Recommendation:**
```typescript
import winston from 'winston';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

## 14. CORS Configuration

**Status:** ✅ IMPLEMENTED

- CORS enabled for all origins in development (index.ts:17)
- **Recommendation for production:** Restrict to frontend domain
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

## Production Checklist

Before deploying to production:
- [ ] Add JWT authentication
- [ ] Implement RBAC for data isolation
- [ ] Add CSRF middleware
- [ ] Add rate limiting
- [ ] Configure CORS for specific domains
- [ ] Add structured logging
- [ ] Enable HTTPS/TLS
- [ ] Set secure cookie flags (httpOnly, sameSite, secure)
- [ ] Run database migrations on production
- [ ] Set up automated backups
- [ ] Enable query timeouts
- [ ] Add API monitoring/alerting
- [ ] Set environment variables properly (no .env in git)

## Summary

**Current State:** Feature-complete with validation and error handling. Security baseline implemented but authentication system required before production.

**Risk Level:** Low for internal/test use. High for production without auth.

**Critical Gap:** Authentication and authorization system must be implemented before customer data is handled.

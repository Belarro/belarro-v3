# Belarro v3 API Documentation

**Version:** 2.0  
**Base URL:** `http://localhost:3001/api`  
**Last Updated:** May 24, 2026

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Invoices API](#invoices-api)
4. [Standing Orders API](#standing-orders-api)
5. [Rate Limiting](#rate-limiting)
6. [Examples](#examples)

---

## Authentication

### Development Mode

In development, all endpoints allow unauthenticated access for testing. No Authorization header is required.

### Production Mode

Production requires JWT authentication:

```
Authorization: Bearer <token>
```

Token format: `<user_id>:<role>`

Valid roles:
- `admin` — Full access
- `customer` — Limited to own data
- `chef` — Kitchen portal access

**Example:**
```bash
curl -H "Authorization: Bearer user123:admin" http://localhost:3001/api/invoices
```

---

## Error Handling

All errors return JSON with consistent format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable description",
  "details": { /* optional */ }
}
```

### Common Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `NOT_FOUND` | 404 | Resource not found |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Invoices API

### GET /invoices

List all invoices with optional filtering.

**Parameters:**
- `customer_id` (optional) — Filter by customer
- `month` (optional) — Filter by month (YYYY-MM)
- `page` (optional, default: 1) — Pagination
- `limit` (optional, default: 20, max: 100) — Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cmpj62boo0000bgdddjq2z82s",
      "customer_id": "customer123",
      "invoice_month": "2026-05",
      "total_amount_eur": 290.00,
      "vat_amount_eur": 55.10,
      "status": "draft",
      "sent_at": null,
      "paid_at": null,
      "customer": {
        "id": "customer123",
        "name": "Restaurant Berlin",
        "email": "contact@restaurant.de"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

---

### GET /invoices/:id

Get a single invoice by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmpj62boo0000bgdddjq2z82s",
    "customer_id": "customer123",
    "invoice_month": "2026-05",
    "total_amount_eur": 290.00,
    "vat_amount_eur": 55.10,
    "status": "draft",
    "customer": { /* ... */ }
  }
}
```

---

### POST /invoices

Generate a monthly invoice for a customer.

**Request Body:**
```json
{
  "customer_id": "customer123",
  "invoice_month": "2026-05"
}
```

**Validation:**
- `customer_id` — Required, must exist
- `invoice_month` — Required, format: YYYY-MM (e.g., 2026-05)
  - Month must be 01-12
  - Year must be within ±5 years of current year
- Invoice must not already exist for this customer/month

**Response:**
```json
{
  "success": true,
  "data": { /* invoice object */ },
  "message": "Invoice generated successfully",
  "details": {
    "order_count": 2,
    "subtotal_eur": 290.00,
    "vat_eur": 55.10,
    "total_with_vat": 345.10
  }
}
```

**Status Code:** 201 Created

---

### PATCH /invoices/:id

Update invoice status or details.

**Request Body:**
```json
{
  "status": "sent",
  "sent_at": "2026-05-24T10:30:00Z",
  "paid_at": "2026-05-25T14:00:00Z"
}
```

**Valid Statuses:**
- `draft` — Initial state
- `sent` — Invoice has been sent to customer
- `paid` — Invoice has been paid

**Response:** Updated invoice object

---

### DELETE /invoices/:id

Delete a draft invoice. Only draft invoices can be deleted.

**Validation:**
- Invoice must exist
- Invoice status must be "draft"

**Response:**
```json
{
  "success": true,
  "message": "Invoice deleted successfully",
  "details": {
    "invoice_id": "cmpj62boo0000bgdddjq2z82s",
    "invoice_month": "2026-05"
  }
}
```

---

## Standing Orders API

### GET /standing-orders

List all standing orders with optional filtering.

**Parameters:**
- `customer_id` (optional) — Filter by customer
- `status` (optional) — Filter by status (active, paused, inactive)
- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "so123",
      "customer_id": "customer123",
      "status": "active",
      "notes": "Weekly Tuesday delivery",
      "items": [
        {
          "id": "item1",
          "size_name": "100g",
          "quantity": 10,
          "price_at_time_eur": 15.00,
          "delivery_day_of_week": 2,
          "variant": { /* ... */ }
        }
      ],
      "customer": {
        "id": "customer123",
        "name": "Restaurant Berlin"
      }
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### GET /standing-orders/:id

Get a single standing order with all items.

---

### POST /standing-orders

Create a new standing order.

**Request Body:**
```json
{
  "customer_id": "customer123",
  "notes": "Weekly Tuesday delivery",
  "items": [
    {
      "variant_id": "var100g",
      "size_name": "100g",
      "quantity": 10,
      "price_at_time_eur": 15.00,
      "delivery_day_of_week": 2
    },
    {
      "variant_id": "var225g",
      "size_name": "225g",
      "quantity": 5,
      "price_at_time_eur": 28.00,
      "delivery_day_of_week": 2
    }
  ]
}
```

**Validation:**
- `customer_id` — Required, must exist
- `items` — Required, non-empty array (max 100 items)
- Per item:
  - `variant_id` — Required, must exist
  - `size_name` — Required
  - `quantity` — Required, must be 1-10,000
  - `price_at_time_eur` — Optional, if provided must be €0-€10,000
  - `delivery_day_of_week` — Optional, if provided must be 0-6 (Monday=0, Sunday=6)

**Response:**
```json
{
  "success": true,
  "data": { /* standing order with items */ },
  "message": "Standing order created successfully",
  "details": {
    "items_count": 2
  }
}
```

**Status Code:** 201 Created

---

### PATCH /standing-orders/:id

Update standing order status or notes.

**Request Body:**
```json
{
  "status": "paused",
  "notes": "Paused until July"
}
```

**Valid Statuses:**
- `active` — Order is recurring
- `paused` — Order is paused, no new orders created
- `inactive` — Order is inactive

**Response:** Updated standing order object

---

### DELETE /standing-orders/:id

Delete a standing order. Deletes all associated items via cascade.

**Response:**
```json
{
  "success": true,
  "message": "Standing order deleted successfully",
  "details": {
    "order_id": "so123",
    "items_deleted": 2
  }
}
```

---

## Rate Limiting

Currently not enforced in MVP. Production will implement:
- **100 requests/minute** for authenticated users
- **10 requests/minute** for unauthenticated users

---

## Examples

### Example 1: Generate Invoice for May 2026

```bash
curl -X POST http://localhost:3001/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cmpj62boo0000bgdddjq2z82s",
    "invoice_month": "2026-05"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "inv123",
    "total_amount_eur": 345.10,
    "vat_amount_eur": 65.57,
    "status": "draft"
  },
  "details": {
    "order_count": 3,
    "subtotal_eur": 1820.00,
    "vat_eur": 345.80,
    "total_with_vat": 2165.80
  }
}
```

---

### Example 2: Create Standing Order

```bash
curl -X POST http://localhost:3001/api/standing-orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cmpj62boo0000bgdddjq2z82s",
    "notes": "Every Tuesday",
    "items": [
      {
        "variant_id": "var100g",
        "size_name": "100g",
        "quantity": 5,
        "price_at_time_eur": 12.50,
        "delivery_day_of_week": 2
      }
    ]
  }'
```

---

### Example 3: Update Invoice to Sent

```bash
curl -X PATCH http://localhost:3001/api/invoices/inv123 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "sent",
    "sent_at": "2026-05-24T10:30:00Z"
  }'
```

---

## Testing with Postman/curl

### Test Invalid Invoice Month

```bash
# Should return 400 VALIDATION_ERROR
curl -X POST http://localhost:3001/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "test",
    "invoice_month": "2026-13"
  }'
```

### Test Invalid Standing Order

```bash
# Should return 400 VALIDATION_ERROR (empty items array)
curl -X POST http://localhost:3001/api/standing-orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "test",
    "items": []
  }'
```

---

## Changelog

### v2.0 (May 24, 2026)
- Added Invoices API (CRUD + generation)
- Added Standing Orders API (CRUD + management)
- Added authentication middleware
- Added comprehensive input validation
- Added error handling

### v1.0 (May 22, 2026)
- Initial MVP with crops, customers, orders

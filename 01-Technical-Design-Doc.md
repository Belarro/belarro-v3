# Belarro Admin — Technical Design Document

**Status:** Phase 1 (Farm Operations)  
**Version:** 1.0  
**Created:** May 24, 2026

---

## 1. API CONTRACT & SPECIFICATIONS

### Base URL
```
http://localhost:3000/api  (development)
https://api.belarro.farm/api  (production)
```

### Authentication
For Phase 1: **No authentication required** (single-user admin panel). Deploy behind basic auth or VPN if needed.

Future: JWT tokens for multi-user roles (Phase 2).

### Response Format
All endpoints return JSON with consistent structure:

**Success (2xx):**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "error": "error_code",
  "message": "Human-readable error message",
  "details": { /* optional: validation errors, etc. */ }
}
```

### HTTP Status Codes
- `200 OK` — Request successful, response data included
- `201 Created` — Resource created successfully
- `204 No Content` — Request successful, no data to return
- `400 Bad Request` — Validation error (missing fields, invalid data)
- `404 Not Found` — Resource does not exist
- `409 Conflict` — Resource conflict (e.g., duplicate, cannot delete due to foreign key)
- `500 Internal Server Error` — Server error

---

## 2. DETAILED API ENDPOINTS

### CROPS

#### GET /crops
List all crops.

**Query Parameters:**
- `status` (optional): "active" | "paused" | "inactive" | "all" (default: "active")
- `page` (optional): default 1
- `limit` (optional): default 20

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "crop-001",
      "name_en": "Broccoli",
      "name_de": "Brokkoli",
      "photo_url": "https://cdn.belarro.farm/broccoli.jpg",
      "seeds_per_tray": 60,
      "yield_per_tray": 25,
      "total_growth_days": 10,
      "seeding_schedule": "FRIDAY",
      "status": "active",
      "growth_stages": [
        { "stage": "germination", "days": 3 },
        { "stage": "growth", "days": 5 },
        { "stage": "harvest-ready", "days": 2 }
      ],
      "created_at": "2026-05-01T10:00:00Z",
      "updated_at": "2026-05-24T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 25 }
}
```

**Error Cases:**
- Invalid `status` value → 400 Bad Request
- Database error → 500 Internal Server Error

---

#### GET /crops/{id}
Get single crop detail.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "crop-001",
    "name_en": "Broccoli",
    "name_de": "Brokkoli",
    "photo_url": "https://cdn.belarro.farm/broccoli.jpg",
    "seeds_per_tray": 60,
    "yield_per_tray": 25,
    "total_growth_days": 10,
    "seeding_schedule": "FRIDAY",
    "status": "active",
    "growth_stages": [
      { "stage": "germination", "days": 3 },
      { "stage": "growth", "days": 5 },
      { "stage": "harvest-ready", "days": 2 }
    ],
    "variants": [
      {
        "id": "var-001",
        "size_name": "Container 30g",
        "size_grams": 30,
        "price_eur": 2.50,
        "container_qty": 1
      }
    ],
    "seed_inventory": {
      "quantity_grams": 940,
      "trays_remaining": 15,
      "reorder_threshold_trays": 20
    },
    "created_at": "2026-05-01T10:00:00Z",
    "updated_at": "2026-05-24T10:00:00Z"
  }
}
```

**Error Cases:**
- Crop not found → 404 Not Found

---

#### POST /crops
Create new crop.

**Request Body:**
```json
{
  "name_en": "Microgreens Mix",
  "name_de": "Microgreens Mix",
  "photo_url": "https://cdn.belarro.farm/mix.jpg",
  "seeds_per_tray": 50,
  "yield_per_tray": 20,
  "total_growth_days": 7,
  "seeding_schedule": "TUESDAY",
  "growth_stages": [
    { "stage": "germination", "days": 2 },
    { "stage": "growth", "days": 3 },
    { "stage": "harvest-ready", "days": 2 }
  ]
}
```

**Required Fields:** name_en, name_de, seeds_per_tray, yield_per_tray, total_growth_days, seeding_schedule  
**Optional Fields:** photo_url, growth_stages

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "crop-002",
    "name_en": "Microgreens Mix",
    "name_de": "Microgreens Mix",
    "status": "active",
    "created_at": "2026-05-24T10:00:00Z"
  },
  "message": "Crop created successfully"
}
```

**Automatic Actions:**
- Create `seed_inventory` record with quantity_grams = 0
- `status` auto-set to "active"

**Error Cases:**
- Missing required field → 400 Bad Request (list which fields)
- Invalid seeding_schedule (not "TUESDAY" or "FRIDAY") → 400 Bad Request

---

#### PUT /crops/{id}
Update crop.

**Request Body:** Any field from POST (all optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "crop-001",
    "name_en": "Broccoli (Updated)",
    "status": "paused",
    "updated_at": "2026-05-24T11:00:00Z"
  },
  "message": "Crop updated successfully"
}
```

**Special Logic:**
- If `total_growth_days` changes: recalculate all pending orders' expected_harvest_date
- If `seeding_schedule` changes: alert user "This will affect pending orders"

**Error Cases:**
- Crop not found → 404 Not Found
- Invalid data → 400 Bad Request

---

#### DELETE /crops/{id}
Delete crop.

**Cascade Rules:**
- Delete associated `product_variants`
- Delete associated `seed_inventory`
- Delete associated `package_inventory`
- Cancel all pending orders using this crop (set status = "cancelled")
- Delete associated `seeding_batches` (and reverse seed inventory deductions)

**Response:**
```json
{
  "success": true,
  "message": "Crop deleted successfully. 3 orders cancelled.",
  "details": {
    "orders_cancelled": 3,
    "variants_deleted": 4
  }
}
```

**Error Cases:**
- Crop not found → 404 Not Found
- Cannot delete if active deliveries exist → 409 Conflict (suggest pause instead)

---

### PRODUCT VARIANTS

#### GET /variants
List all variants (optionally filtered by crop).

**Query Parameters:**
- `crop_id` (optional): filter by crop

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "var-001",
      "crop_id": "crop-001",
      "crop_name_en": "Broccoli",
      "size_name": "Container 30g",
      "size_grams": 30,
      "price_eur": 2.50,
      "container_qty": 1,
      "created_at": "2026-05-01T10:00:00Z",
      "updated_at": "2026-05-24T10:00:00Z"
    }
  ]
}
```

---

#### POST /variants
Create new product variant.

**Request Body:**
```json
{
  "crop_id": "crop-001",
  "size_name": "100g Bag",
  "size_grams": 100,
  "price_eur": 4.50,
  "container_qty": null
}
```

**Required Fields:** crop_id, size_name, size_grams, price_eur

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "var-002",
    "crop_id": "crop-001",
    "size_name": "100g Bag",
    "price_eur": 4.50,
    "created_at": "2026-05-24T10:00:00Z"
  }
}
```

**Automatic Actions:**
- Create `package_inventory` record with quantity_available = 0

**Error Cases:**
- Crop not found → 404 Not Found
- Invalid price (negative, etc.) → 400 Bad Request

---

#### PUT /variants/{id}
Update variant.

**Request Body:** Any field from POST (all optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "var-001",
    "price_eur": 3.00,
    "updated_at": "2026-05-24T11:00:00Z"
  }
}
```

**Special Logic:**
- If price changes: alert user "Price changed. New orders use new price."

**Error Cases:**
- Variant not found → 404 Not Found

---

#### DELETE /variants/{id}
Delete variant.

**Cascade Rules:**
- Delete associated `package_inventory`
- Cancel all orders using this variant

**Response:**
```json
{
  "success": true,
  "message": "Variant deleted. 2 orders cancelled."
}
```

**Error Cases:**
- Variant not found → 404 Not Found
- Cannot delete if delivered orders exist → 409 Conflict

---

### ORDERS

#### GET /orders
List all orders.

**Query Parameters:**
- `status` (optional): "pending_seed" | "growing" | "ready_harvest" | "packed" | "delivered" | "partial_delivery" | "cancelled"
- `customer_id` (optional): filter by customer
- `crop_id` (optional): filter by crop
- `page` (optional): default 1
- `limit` (optional): default 20

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "order-001",
      "customer_id": "cust-001",
      "customer_name": "Restaurant X",
      "product_variant_id": "var-001",
      "crop_name_en": "Broccoli",
      "variant_name": "Container 30g",
      "quantity": 5,
      "order_date": "2026-05-24T09:00:00Z",
      "next_delivery_date": "2026-05-31T00:00:00Z",
      "expected_harvest_date": "2026-05-30T00:00:00Z",
      "status": "pending_seed",
      "recurring": true,
      "created_at": "2026-05-24T09:00:00Z",
      "updated_at": "2026-05-24T09:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45 }
}
```

---

#### POST /orders
Create new order.

**Request Body:**
```json
{
  "customer_id": "cust-001",
  "product_variant_id": "var-001",
  "quantity": 5,
  "order_date": "2026-05-24",
  "recurring": true
}
```

**Required Fields:** customer_id, product_variant_id, quantity  
**Optional Fields:** order_date (default: today), recurring (default: true)

**System Calculates:**
- Crop from variant
- Growth days from crop
- Seeding schedule from crop
- Expected seeding date (next Tuesday or Friday based on crop schedule)
- Expected harvest date (seeding date + growth days)
- Next delivery date (harvest date)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-001",
    "customer_id": "cust-001",
    "product_variant_id": "var-001",
    "quantity": 5,
    "status": "pending_seed",
    "expected_harvest_date": "2026-05-31T00:00:00Z",
    "next_delivery_date": "2026-05-31T00:00:00Z",
    "message": "Will seed on 2026-05-24 (Friday), harvest on 2026-05-31 (Friday)"
  }
}
```

**Error Cases:**
- Customer not found → 404 Not Found
- Variant not found → 404 Not Found
- Invalid quantity (0 or negative) → 400 Bad Request

---

#### PUT /orders/{id}
Update order.

**Request Body:** Any field (all optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-001",
    "quantity": 10,
    "status": "paused",
    "updated_at": "2026-05-24T11:00:00Z"
  }
}
```

**Special Logic:**
- If `quantity` changes: recalculate tray requirement, alert if underproduction likely
- If `product_variant_id` changes: recalculate everything (crop, growth days, seeding date, harvest date)
- If `status` changes to "cancelled": don't reverse inventory (keep record for history)

**Error Cases:**
- Order not found → 404 Not Found

---

#### DELETE /orders/{id}
Delete order.

**Cascade Rules:**
- Delete associated `order_fulfillment` records
- Reverse any seed inventory deductions (if seeded)
- Reverse any sample inventory additions

**Response:**
```json
{
  "success": true,
  "message": "Order deleted. Inventory reversed."
}
```

**Error Cases:**
- Order not found → 404 Not Found
- Cannot delete if delivered → 409 Conflict (set status = "cancelled" instead)

---

### SEEDING BATCHES

#### GET /seeding/ready-today
Get orders ready to seed TODAY.

**Logic:**
- Today's day of week: Monday-Sunday
- If today is Tuesday OR today is Friday: show orders
- Otherwise: show empty

**Response:**
```json
{
  "success": true,
  "data": {
    "seeding_date": "2026-05-24",
    "seeding_day": "FRIDAY",
    "crops_to_seed": [
      {
        "crop_id": "crop-001",
        "crop_name_en": "Broccoli",
        "crop_name_de": "Brokkoli",
        "order_trays_needed": 3,
        "sample_trays_recommended": 1,
        "seeds_per_tray": 60,
        "total_seeds_needed_grams": 180,
        "current_seed_inventory": 940,
        "orders": [
          {
            "order_id": "order-001",
            "customer_name": "Restaurant X",
            "quantity": 5,
            "variant_name": "Container 30g"
          }
        ]
      }
    ]
  }
}
```

---

#### GET /seeding/batches
List all seeding batches.

**Query Parameters:**
- `status` (optional): "pending_harvest" | "harvested"
- `page` (optional): default 1
- `limit` (optional): default 20

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "batch-001",
      "crop_id": "crop-001",
      "crop_name_en": "Broccoli",
      "seeding_date": "2026-05-24",
      "quantity_trays": 3,
      "batch_type": "order",
      "expected_harvest_date": "2026-05-31",
      "status": "pending_harvest",
      "created_at": "2026-05-24T10:00:00Z",
      "updated_at": "2026-05-24T10:00:00Z"
    }
  ]
}
```

---

#### POST /seeding/batches
Log trays seeded.

**Request Body:**
```json
{
  "crop_id": "crop-001",
  "seeding_date": "2026-05-24",
  "quantity_trays": 3,
  "batch_type": "order"
}
```

**Required Fields:** crop_id, seeding_date, quantity_trays, batch_type  
**Allowed batch_type:** "order" | "sample"

**System Calculates:**
- expected_harvest_date = seeding_date + crop.total_growth_days
- Deduct from seed_inventory: quantity_trays * crop.seeds_per_tray

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "batch-001",
    "crop_id": "crop-001",
    "quantity_trays": 3,
    "expected_harvest_date": "2026-05-31",
    "seeds_deducted_grams": 180,
    "seed_inventory_remaining": 760
  },
  "message": "Batch seeded. 180g deducted from inventory. Ready to harvest on 2026-05-31."
}
```

**Alert Cases:**
- If quantity_trays * seeds_per_tray > current_inventory: 400 Bad Request "Insufficient seeds"

**Error Cases:**
- Crop not found → 404 Not Found
- Insufficient seeds → 400 Bad Request

---

#### PUT /seeding/batches/{id}
Update seeding batch.

**Request Body:** Any field (all optional)

**Special Logic:**
- If `quantity_trays` changes: adjust seed inventory deduction
- If `batch_type` changes from "order" to "sample": just update, no inventory change

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "batch-001",
    "quantity_trays": 4,
    "seeds_deducted_grams": 240
  }
}
```

---

#### DELETE /seeding/batches/{id}
Delete seeding batch.

**Cascade Rules:**
- Reverse seed inventory deduction
- Delete associated harvest records (if any)

**Response:**
```json
{
  "success": true,
  "message": "Batch deleted. 180g seeds restored to inventory."
}
```

---

### HARVEST RECORDS

#### GET /harvest/ready-today
Get batches ready to harvest TODAY (if today is Tuesday).

**Response:**
```json
{
  "success": true,
  "data": {
    "harvest_date": "2026-05-28",
    "batches_ready": [
      {
        "batch_id": "batch-001",
        "crop_id": "crop-001",
        "crop_name_en": "Broccoli",
        "quantity_trays": 3,
        "expected_yield_grams": 75,
        "orders_waiting": [
          {
            "order_id": "order-001",
            "customer_name": "Restaurant X",
            "quantity_needed_grams": 150
          }
        ]
      }
    ]
  }
}
```

---

#### POST /harvest
Log actual harvest yield.

**Request Body:**
```json
{
  "seeding_batch_id": "batch-001",
  "harvest_date": "2026-05-28",
  "actual_yield_grams": 85,
  "notes": "Good weather, excellent yield"
}
```

**Required Fields:** seeding_batch_id, harvest_date, actual_yield_grams

**System Calculates:**
- Get orders waiting for this harvest
- total_ordered = SUM(orders[qty_grams])
- IF actual_yield >= total_ordered:
  - yield_for_orders = total_ordered
  - yield_for_samples = actual_yield - total_ordered
- ELSE:
  - yield_for_orders = actual_yield
  - yield_for_samples = 0
  - ALERT: "Underproduction for X orders"
- Update sample_inventory
- Update order statuses to "ready_harvest"

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "harvest-001",
    "seeding_batch_id": "batch-001",
    "actual_yield_grams": 85,
    "yield_for_orders_grams": 75,
    "yield_for_samples_grams": 10,
    "sample_inventory_updated": true,
    "orders_ready": 1,
    "alerts": []
  }
}
```

**Alert Cases:**
- IF underproduction: include alert message

---

#### PUT /harvest/{id}
Update harvest record.

**Request Body:** Any field (all optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "harvest-001",
    "actual_yield_grams": 90,
    "yield_for_samples_grams": 15
  }
}
```

---

#### DELETE /harvest/{id}
Delete harvest record.

**Cascade Rules:**
- Reverse sample inventory additions
- Set associated orders back to "growing"

**Response:**
```json
{
  "success": true,
  "message": "Harvest deleted. Orders set back to growing status."
}
```

---

### CUSTOMERS

#### GET /customers
List all customers.

**Query Parameters:**
- `status` (optional): "prospect" | "active" | "paused" | "inactive"
- `search` (optional): search by name, email, or WhatsApp
- `page` (optional): default 1
- `limit` (optional): default 20

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cust-001",
      "name": "Restaurant X",
      "address": "Kurfürstendamm 100",
      "city": "Berlin",
      "email": "contact@restaurantx.de",
      "whatsapp": "+491234567890",
      "phone": "+49309876543",
      "status": "active",
      "net_days": 30,
      "first_contact_date": "2026-05-01",
      "total_orders": 5,
      "total_spent_eur": 125.00,
      "last_delivery_date": "2026-05-24",
      "created_at": "2026-05-01T10:00:00Z",
      "updated_at": "2026-05-24T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 8 }
}
```

---

#### POST /customers
Create new customer (prospect).

**Request Body:**
```json
{
  "name": "Restaurant Y",
  "address": "Charlottenstrasse 50",
  "city": "Berlin",
  "email": "contact@restauranty.de",
  "whatsapp": "+491234567891",
  "phone": "+49309876544",
  "net_days": 30
}
```

**Required Fields:** name, email OR whatsapp  
**Optional Fields:** address, city, phone, net_days (default: 30)

**System Calculates:**
- first_contact_date = today
- status = "prospect"
- Create 5 follow-up tasks automatically

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cust-002",
    "name": "Restaurant Y",
    "status": "prospect",
    "follow_ups_created": 5,
    "message": "Customer created. 5 follow-ups scheduled."
  }
}
```

---

#### PUT /customers/{id}
Update customer.

**Request Body:** Any field (all optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cust-001",
    "name": "Restaurant X (Updated)",
    "status": "active",
    "updated_at": "2026-05-24T11:00:00Z"
  }
}
```

---

#### DELETE /customers/{id}
Delete customer.

**Cascade Rules:**
- Delete all orders
- Delete all visits
- Delete all follow-ups
- Delete all order fulfillments

**Response:**
```json
{
  "success": true,
  "message": "Customer deleted. 5 orders, 3 visits, 5 follow-ups removed."
}
```

---

#### GET /customers/{id}/orders
Get customer's order history.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "order-001",
      "crop_name_en": "Broccoli",
      "variant_name": "Container 30g",
      "quantity": 5,
      "order_date": "2026-05-24",
      "status": "delivered",
      "delivery_date": "2026-05-31",
      "total_price_eur": 12.50
    }
  ]
}
```

---

### FOLLOW-UPS

#### GET /follow-ups
List all follow-ups.

**Query Parameters:**
- `status` (optional): "pending" | "sent" | "completed"
- `customer_id` (optional): filter by customer
- `page` (optional): default 1
- `limit` (optional): default 20

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "fup-001",
      "customer_id": "cust-001",
      "customer_name": "Restaurant X",
      "follow_up_number": 1,
      "follow_up_days": 0,
      "due_date": "2026-05-01",
      "status": "sent",
      "sent_via": "whatsapp",
      "sent_date": "2026-05-02",
      "notes": "Received positive response",
      "created_at": "2026-05-01T10:00:00Z"
    }
  ]
}
```

---

#### POST /follow-ups
Manually create follow-up (usually auto-created, but allow manual creation).

**Request Body:**
```json
{
  "customer_id": "cust-001",
  "follow_up_number": 2,
  "status": "pending"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "fup-002",
    "customer_id": "cust-001",
    "follow_up_number": 2,
    "due_date": "2026-05-03"
  }
}
```

---

#### PUT /follow-ups/{id}
Update follow-up (mark as sent, add notes, etc.).

**Request Body:**
```json
{
  "status": "sent",
  "sent_via": "email",
  "sent_date": "2026-05-03",
  "notes": "No response yet, will call tomorrow"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "fup-001",
    "status": "sent",
    "sent_via": "email",
    "sent_date": "2026-05-03"
  }
}
```

---

#### DELETE /follow-ups/{id}
Delete follow-up.

**Response:**
```json
{
  "success": true,
  "message": "Follow-up deleted"
}
```

---

### INVENTORY

#### GET /inventory/seeds
List seed stock with alerts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "crop_id": "crop-001",
      "crop_name_en": "Broccoli",
      "quantity_grams": 940,
      "seeds_per_tray": 60,
      "trays_remaining": 15,
      "reorder_threshold_trays": 20,
      "status": "low",
      "alert": "Order seeds. Only 15 trays remaining (threshold: 20)",
      "last_purchase_date": "2026-05-20",
      "last_purchase_qty_grams": 500
    }
  ]
}
```

**Alert Statuses:**
- "low" → trays_remaining < reorder_threshold_trays
- "ok" → trays_remaining >= reorder_threshold_trays
- "empty" → quantity_grams = 0

---

#### POST /inventory/seeds/{crop_id}/add
Add purchased seeds.

**Request Body:**
```json
{
  "quantity_grams": 1000,
  "purchase_date": "2026-05-24"
}
```

**Required Fields:** quantity_grams

**System Calculates:**
- seed_inventory[crop_id].quantity_grams += quantity_grams
- Update last_purchase_date, last_purchase_qty_grams

**Response:**
```json
{
  "success": true,
  "data": {
    "crop_id": "crop-001",
    "quantity_grams": 1940,
    "trays_remaining": 32,
    "message": "1000g seeds added. Threshold alert cleared."
  }
}
```

---

#### GET /inventory/samples
List available samples by crop.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "crop_id": "crop-001",
      "crop_name_en": "Broccoli",
      "available_grams": 50,
      "last_updated": "2026-05-24T10:00:00Z"
    },
    {
      "crop_id": "crop-002",
      "crop_name_en": "Pea Shoots",
      "available_grams": 150,
      "last_updated": "2026-05-24T09:00:00Z"
    }
  ]
}
```

---

#### PUT /inventory/samples/{crop_id}
Manually adjust sample inventory (if you used samples, discarded, etc.).

**Request Body:**
```json
{
  "available_grams": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "crop_id": "crop-001",
    "available_grams": 30,
    "adjusted_by": "manual",
    "updated_at": "2026-05-24T11:00:00Z"
  }
}
```

---

### DASHBOARD

#### GET /dashboard/summary
Get KPIs for dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_trays_grown_all_time": 250,
    "total_kg_harvested_all_time": 6250,
    "active_crops_count": 8,
    "crops_currently_growing": [
      {
        "crop_name_en": "Broccoli",
        "quantity_trays": 5,
        "expected_harvest_date": "2026-05-28"
      }
    ],
    "active_customers_count": 7,
    "upcoming_harvests_7_days": 3,
    "tasks_this_week": {
      "seeding_due": 2,
      "harvest_due": 1,
      "follow_ups_due": 4
    },
    "seed_alerts": 2,
    "package_alerts": 1,
    "recent_deliveries_7_days": [
      {
        "customer_name": "Restaurant X",
        "crop_name_en": "Broccoli",
        "quantity_grams": 150,
        "delivery_date": "2026-05-24",
        "status": "delivered"
      }
    ]
  }
}
```

---

## 3. ERROR HANDLING

### Common Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Invalid input (missing field, wrong type, etc.) |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Resource conflict (duplicate, foreign key constraint, etc.) |
| `INSUFFICIENT_INVENTORY` | 400 | Not enough seeds/packages for operation |
| `INVALID_STATUS_TRANSITION` | 400 | Cannot transition to this status (e.g., cancel delivered order) |
| `CONSTRAINT_VIOLATION` | 409 | Cannot delete due to dependent data |
| `INTERNAL_ERROR` | 500 | Server error |

### Example Error Response

```json
{
  "success": false,
  "error": "INSUFFICIENT_INVENTORY",
  "message": "Cannot seed 5 trays. Only 200g seeds available (need 300g).",
  "details": {
    "crop_id": "crop-001",
    "trays_requested": 5,
    "seeds_needed_grams": 300,
    "seeds_available_grams": 200
  }
}
```

---

## 4. DATABASE CONSTRAINTS

### Foreign Key Constraints
- `orders.customer_id` → `customers.id` (ON DELETE CASCADE)
- `orders.product_variant_id` → `product_variants.id` (ON DELETE CASCADE)
- `product_variants.crop_id` → `crops.id` (ON DELETE CASCADE)
- `seeding_batches.crop_id` → `crops.id` (ON DELETE CASCADE)
- `harvest_records.seeding_batch_id` → `seeding_batches.id` (ON DELETE CASCADE)
- `order_fulfillment.order_id` → `orders.id` (ON DELETE CASCADE)
- `order_fulfillment.harvest_record_id` → `harvest_records.id` (ON DELETE CASCADE)
- `follow_ups.customer_id` → `customers.id` (ON DELETE CASCADE)
- `visits.customer_id` → `customers.id` (ON DELETE CASCADE)

### Unique Constraints
- None (allow duplicates for flexibility, enforce at application level if needed)

### Check Constraints
- `crops.seeds_per_tray > 0`
- `crops.yield_per_tray > 0`
- `crops.total_growth_days > 0`
- `product_variants.price_eur > 0`
- `product_variants.size_grams > 0`
- `orders.quantity > 0`
- `seeding_batches.quantity_trays > 0`
- `harvest_records.actual_yield_grams >= 0`

---

## 5. TRANSACTIONS & ATOMICITY

### Critical Operations (Must Be Atomic)

**Seeding Batch Creation:**
1. Create `seeding_batches` record
2. Deduct from `seed_inventory`
3. Update order statuses to "growing"

If any step fails, entire operation rolls back.

**Harvest Recording:**
1. Create `harvest_records` record
2. Create `order_fulfillment` records (allocate to orders)
3. Update `sample_inventory`
4. Update order statuses to "ready_harvest"

If any step fails, entire operation rolls back.

**Order Deletion (if seeded):**
1. Delete `order_fulfillment` records
2. Restore `seed_inventory`
3. Delete `orders` record

If any step fails, entire operation rolls back.

---

## 6. RATE LIMITING & PERFORMANCE

### No Rate Limiting (Phase 1)
Single-user admin panel. No rate limiting needed.

### Expected Load
- Concurrent users: 1 (you)
- Requests per hour: ~100-200
- Database size: ~10MB (initial)

### Performance Targets
- API response time: <500ms for all endpoints
- Dashboard load: <2s
- Seeding screen: <1s
- No N+1 queries (use eager loading with Prisma)

---

## 7. DATA VALIDATION

### Input Validation (Frontend + Backend)

**Crops:**
- name_en, name_de: non-empty string, max 100 chars
- seeds_per_tray: integer, 1-1000
- yield_per_tray: number, 0.1-1000
- total_growth_days: integer, 1-60
- seeding_schedule: "TUESDAY" or "FRIDAY"

**Orders:**
- quantity: integer, 1-10000
- order_date: valid date
- customer_id, product_variant_id: valid IDs

**Seeding Batches:**
- quantity_trays: integer, 1-100
- seeding_date: valid date
- batch_type: "order" or "sample"

**Harvest:**
- actual_yield_grams: number, >= 0
- harvest_date: valid date

**Customers:**
- name: non-empty string, max 100 chars
- email: valid email format (if provided)
- whatsapp: valid phone number format (if provided)
- net_days: integer, 1-90

---

## 8. DEPLOYMENT CHECKLIST

Before production deployment:
- [ ] All API endpoints tested with Postman/Thunder Client
- [ ] Error handling tested (missing fields, invalid IDs, etc.)
- [ ] Database constraints in place
- [ ] Transactions working correctly
- [ ] No console.log() in production code
- [ ] Environment variables set up (.env.production)
- [ ] Database backups configured
- [ ] Monitoring (Sentry or similar) configured
- [ ] HTTPS enabled
- [ ] CORS configured correctly

---

**End of Technical Design Document**

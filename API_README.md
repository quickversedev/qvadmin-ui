# QuickVerse Admin — API Documentation

## Table of Contents

- [Base Configuration](#base-configuration)
- [Authentication](#authentication)
- [Campus](#campus)
- [Orders](#orders)
- [Vendor](#vendor)
- [Notifications](#notifications)
- [App Config](#app-config)

---

## Base Configuration

| Property     | Value                               |
| ------------ | ----------------------------------- |
| **Base URL** | http://prd.quickverse.in/quickVerse |

### Common Headers

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>          # For protected routes
Authorization: Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx  # For auth routes
```

---

## Authentication

> **Base Auth Header:** `Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx`

---

### 1. Request OTP

Sends an OTP to the given phone number for login.

```http
POST /v1/requestOtp
```

**Headers:**

```http
Authorization: Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx
Content-Type: application/json
```

**Request Body:**

```json
{
  "phone": "9876543210"
}
```

**Response:**

```json
{
  "response": {
    "verificationId": "abc123xyz"
  }
}
```

| Field            | Type     | Description                                |
| ---------------- | -------- | ------------------------------------------ |
| `phone`          | `string` | User's phone number (without country code) |
| `verificationId` | `string` | ID used to verify OTP in next step         |

---

### 2. Verify OTP / Login

Verifies the OTP and returns a JWT token on success.

```http
POST /v1/login
```

**Headers:**

```http
Authorization: Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx
Content-Type: application/json
```

**Request Body:**

```json
{
  "phone": "919876543210",
  "otp": "123456",
  "verificationId": "abc123xyz"
}
```

> ⚠️ Note: Phone number is prefixed with country code `91` before sending.

**Response:**

```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "phone": "919876543210",
  "newUser": false
}
```

| Field     | Type      | Description                                     |
| --------- | --------- | ----------------------------------------------- |
| `jwt`     | `string`  | JWT token for subsequent authenticated requests |
| `phone`   | `string`  | User's phone number with country code           |
| `newUser` | `boolean` | Whether the user is newly registered            |

---

## Orders

> 🔒 All order APIs require Bearer token authentication.

---

### 4. Get Orders

Fetches paginated list of orders filtered by campus, status, and time range.

```http
GET /v2/order/OrderStatus
```

**Headers:**

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Query Parameters:**

| Parameter  | Type     | Required | Description                                |
| ---------- | -------- | -------- | ------------------------------------------ |
| `regionId` | `string` | ✅       | ID of the selected campus                  |
| `status`   | `string` | ✅       | Order status filter (see statuses below)   |
| `from`     | `string` | ✅       | Start datetime (ISO 8601 format)           |
| `to`       | `string` | ✅       | End datetime (ISO 8601 format)             |
| `page`     | `number` | ✅       | Page number for pagination (starts at `1`) |
| `limit`    | `number` | ✅       | Number of records per page                 |

**Order Status Values:**

| Status      | Description                       |
| ----------- | --------------------------------- |
| `PENDING`   | Newly placed, awaiting acceptance |
| `ACCEPTED`  | Accepted by vendor                |
| `PACKED`    | Packed and ready to ship          |
| `SHIPPED`   | Out for delivery                  |
| `COMPLETED` | Successfully delivered            |
| `CANCELLED` | Cancelled or rejected             |

**Example Request:**

```http
GET /v1/order/OrderStatus?regionId=campus_001&status=PENDING&from=2026-03-03T00:00:00Z&to=2026-03-03T23:59:59Z&page=1&limit=20
```

**Response:**

```json
{
  "status": "success",
  "response": {
    "orders": [
      {
        "id": "order_001",
        "status": "PENDING",
        "vendorId": "vendor_001",
        "vendorName": "Food Corner",
        "customerName": "John Doe",
        "customerPhone": "9876543210",
        "deliveryAddress": "Room 101, Block A",
        "items": [
          {
            "name": "Burger",
            "quantity": 2,
            "price": 150
          }
        ],
        "totalAmount": 300,
        "createdAt": "2026-03-03T10:00:00Z",
        "updatedAt": "2026-03-03T10:05:00Z"
      }
    ],
    "totalCount": 50,
    "page": 1,
    "limit": 20
  }
}
```

---

## Vendor

> 🔒 All vendor APIs require Bearer token authentication.

---

### 6. Get Vendors by Campus

Fetches all vendors operating within a specific campus.

```http
GET /v3/regions/shops?regionId=REG-ID
```

**Headers:**

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters:**

| Parameter  | Type     | Required | Description      |
| ---------- | -------- | -------- | ---------------- |
| `regionId` | `string` | ✅       | ID of the campus |

**Response:**

```json
{
  "status": "success",
  "response": [
    {
      "id": "vendor_001",
      "name": "Food Corner",
      "category": "Food",
      "pickupAddress": "Stall No. 5, Food Court",
      "isActive": true
    }
  ]
}
```

## Error Handling

All APIs return consistent error responses:

```json
{
  "status": "error",
  "message": "Unauthorized",
  "code": 401
}
```

**Common HTTP Status Codes:**

| Code  | Meaning                                 |
| ----- | --------------------------------------- |
| `200` | Success                                 |
| `400` | Bad Request — Invalid parameters        |
| `401` | Unauthorized — Invalid or expired token |
| `403` | Forbidden — Insufficient permissions    |
| `404` | Not Found — Resource doesn't exist      |
| `429` | Too Many Requests — Rate limit exceeded |
| `500` | Internal Server Error                   |

---

## Time Filter Reference

Used in the orders listing screen to filter by time range:

| Filter Label | Duration           |
| ------------ | ------------------ |
| Last 1 Hour  | `from = now - 1h`  |
| Last 3 Hours | `from = now - 3h`  |
| Last 1 Day   | `from = now - 24h` |
| Last 30 Days | `from = now - 30d` |

---

_Last Updated: March 2026 — QuickVerse Admin v1.x_

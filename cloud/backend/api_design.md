# IoT Backend API Design Document

**Version:** 1.0.0  
**Base URL:** `http://<backend_host>:3000/api`  
**Authentication:** JWT Bearer token for all protected endpoints.

---

## 1. /status
- **Method:** GET  
- **Auth:** None  
- **Description:** Returns basic system status and API version.

**Response Example:**
```json
{
  "status": "OK",
  "api_version": "1.0.0",
  "timestamp": "2025-11-15T16:00:00.000Z"
}
```

---

## 2. /auth/register
- **Method:** POST  
- **Auth:** None  
- **Description:** Registers a new user.

**Request Body:**
```json
{
  "email": "string, valid email",
  "password": "string, min 8 chars",
  "full_name": "optional string"
}
```

**Response:**
```json
{
  "user_id": "UUID",
  "email": "user@example.com"
}
```

**Validation:**
- `email` required, must be valid  
- `password` required, min 8 chars  
- Returns 409 if email exists

---

## 3. /auth/login
- **Method:** POST  
- **Auth:** None  
- **Description:** Logs in a user and returns JWT token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "JWT token",
  "token_type": "Bearer",
  "expires_in": 7200
}
```

---

## 4. /user/profile
- **Method:** GET  
- **Auth:** Bearer JWT  
- **Description:** Returns profile info for logged-in user.

**Response Example:**
```json
{
  "user_id": "UUID",
  "email": "user@example.com",
  "full_name": "User Name",
  "roles": "user",
  "created_at": "ISO timestamp"
}
```

---

## 5. /devices
- **GET** → Returns all devices.
- **POST** → Add new device.

**POST Body:**
```json
{
  "name": "string",
  "type": "string",
  "location": "optional string"
}
```

**Responses:**
- **GET:**
```json
[
  {
    "device_id": "UUID",
    "name": "Sensor A",
    "type": "CO2",
    "location": "Lab A",
    "metadata": "{}",
    "status": "ON",
    "last_seen": "ISO timestamp",
    "created_at": "ISO timestamp"
  }
]
```
- **POST:**
```json
{ "device_id": "UUID" }
```

---

## 6. /devices/:device_id
- **GET** → Device details
- **PUT** → Update device (name, location, status)

**PUT Body:**
```json
{
  "name": "optional string",
  "location": "optional string",
  "status": "optional enum: ON|OFF|ER"
}
```

**Response:**
```json
{ "message": "Device updated" }
```

---

## 7. /devices/:device_id/status
- **GET** → Returns current status
- **PUT** → Update status

**PUT Body:**
```json
{
  "status": "ON|OFF|ER"
}
```

**Response:**
```json
{ "message": "Status updated" }
```

---

## 8. /measurements
- **GET** → Returns historical measurements, optional filters:
```
Query params:
  device_id: optional UUID
  limit: optional integer (1-100)
```
- **POST** → Add measurement

**POST Body:**
```json
{
  "device_id": "UUID",
  "metrics": {
    "co2": number,
    "temperature": number,
    "humidity": number
  }
}
```

- **GET /measurements/latest** → latest measurement per device

---

## 9. /thresholds
- **GET** → Returns thresholds
- **POST** → Create/update thresholds

**POST Body:**
```json
{
  "scope": "string (device/global)",
  "device_id": "optional UUID",
  "thresholds": {
    "co2_warning": number,
    "co2_critical": number,
    "temperature_min": number,
    "temperature_max": number,
    "humidity_min": number,
    "humidity_max": number
  }
}
```

**Response:**
```json
{ "message": "Threshold updated/created" }
```

---

## 10. /alerts
- **GET** → Returns all alerts (active and historical)

**Response Example:**
```json
[
  {
    "alert_id": "UUID",
    "device_id": "UUID",
    "metric": "co2",
    "value": 1200,
    "threshold": "co2_warning",
    "severity": "warning",
    "status": "active",
    "created_at": "ISO timestamp",
    "resolved_at": null
  }
]
```

---

## Authentication
- All endpoints except `/status`, `/auth/register`, `/auth/login` require:
```
Header:
Authorization: Bearer <JWT token>
```
- Tokens expire in 2 hours.

---

## Validation Summary

| Endpoint | Required Fields | Optional | Notes |
|----------|----------------|----------|-------|
| /auth/register | email, password | full_name | email must be unique |
| /auth/login | email, password | - | - |
| /devices POST | name, type | location | - |
| /devices PUT | status | name, location | status = ON/OFF/ER |
| /measurements POST | device_id, metrics | - | metrics = object with co2/temp/humidity |
| /thresholds POST | scope, thresholds | device_id | thresholds = object with numeric limits |
| /devices/:device_id/status PUT | status | - | status = ON/OFF/ER |


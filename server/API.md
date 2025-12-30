# Hiking Tracker Admin API Documentation

Base URL: `http://localhost:5000/api`

## Authentication
All endpoints require a valid Supabase JWT token in the Authorization header.
The user associated with the token must have `role: 'admin'`.

**Header:**
`Authorization: Bearer <your_jwt_token>`

---

## Users

### Get Users
`GET /users`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search by username
- `status` (string): Filter by status ('active', 'disabled')
- `role` (string): Filter by role ('user', 'admin')

**Response:**
```json
{
  "data": [ ...user objects... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Create User
`POST /users`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "newuser",
  "role": "user", // or "admin"
  "phone": "1234567890"
}
```

### Update User
`PUT /users/:id`

**Body:**
```json
{
  "username": "updatedName",
  "role": "admin",
  "status": "active",
  "phone": "0987654321",
  "password": "newPassword" // Optional
}
```

### Delete User
`DELETE /users/:id`

---

## Routes

### Get Routes
`GET /routes`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search by route name
- `status` (string): Filter by status ('active', 'offline')
- `difficulty` (number): Filter by difficulty (1-5)

**Response:**
```json
{
  "data": [ ...route objects... ],
  "pagination": { ... }
}
```

### Create Route
`POST /routes`

**Body:**
```json
{
  "name": "Scenic Mountain Trail",
  "city_id": "uuid",
  "difficulty": 3.5,
  "duration_hours": 4.0,
  "distance_km": 12.5,
  "description": "A beautiful trail...",
  "start_point": "North Gate",
  "end_point": "South Gate",
  "waypoints": "Point A, Point B",
  "tags": ["mountain", "view"],
  "status": "active"
}
```

### Update Route
`PUT /routes/:id`

**Body:**
(Same as Create Route)

### Delete Route
`DELETE /routes/:id`

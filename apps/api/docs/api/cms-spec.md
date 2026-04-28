# Artifact: Content Management System (CMS) API Specification

## Overview
This module controls the dynamic marketing and informational content of the platform. It allows administrators to deploy global banners (Homepage) or targeted banners/announcements specific to certain game categories.

## Architecture Stack
* **Framework:** Laravel 11
* **Pattern:** Action-Oriented Architecture (AOA) + DTOs
* **Database:** MySQL
* **Security:** Sanctum Authentication, Explicit Audit Trails

## Entity Relationships & Strategy
1. **Banners & Announcements:**
   * Both tables utilize a nullable `category_id` foreign key.
   * **Global Scope:** If `category_id` is `null`, the frontend should interpret this as a global asset to be displayed on the Homepage. The resource will return `scope: "global"`.
   * **Targeted Scope:** If `category_id` contains an ID, the asset should only be rendered when the user navigates to that specific category's page. The resource will return `scope: "targeted"`.
   * **Foreign Key Strategy:** `onDelete('set null')` — if a category is deleted, targeted banners/announcements are automatically demoted to global scope, preventing abrupt deletion of marketing materials.

## Implementation Rules Enforced
1. **Explicit Audit Trails:** Every modification to the CMS is explicitly logged inside Action classes (e.g., "Admin created Banner: Promo Ramadan [Homepage]"). No implicit Observers allowed.
2. **Thin Controllers:** Strictly route logic and DTO transformations. Zero business logic.
3. **Standard Routing:** Strict adherence to standard route definitions over resource routes.

## API Route Structure (Prefix: `/api/v1/`)

### Banners
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/banners` | Paginated list of all banners with category |
| `POST` | `/banners` | Create a new banner |
| `GET` | `/banners/{id}` | Get a single banner |
| `PUT` | `/banners/{id}` | Update an existing banner |
| `DELETE` | `/banners/{id}` | Delete a banner |

### Announcements
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/announcements` | Paginated list of all announcements with category |
| `POST` | `/announcements` | Create a new announcement |
| `GET` | `/announcements/{id}` | Get a single announcement |
| `PUT` | `/announcements/{id}` | Update an existing announcement |
| `DELETE` | `/announcements/{id}` | Delete an announcement |

## Request Payload Reference

### POST/PUT `/banners`
```json
{
  "category_id": 1,
  "name": "Promo Ramadan",
  "image_path": "https://cdn.example.com/banners/ramadan.jpg",
  "link": "https://example.com/promo/ramadan"
}
```

### POST/PUT `/announcements`
```json
{
  "category_id": null,
  "content": "Server maintenance scheduled for Sunday 00:00 - 02:00 WIB.",
  "image_path": null,
  "is_active": true
}
```

## Response Resource Shape

### BannerResource
```json
{
  "id": 1,
  "category_id": null,
  "name": "Homepage Banner",
  "image_path": "...",
  "link": "...",
  "scope": "global",
  "category": null,
  "created_at": "...",
  "updated_at": "..."
}
```

> [!TIP]
> The `scope` field is a computed field added by the API resource layer. Frontend clients can use it directly to decide rendering behavior without inspecting `category_id` themselves.

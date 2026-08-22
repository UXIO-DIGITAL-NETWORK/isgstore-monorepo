# Artifact: Category Master Data API Specification

## Overview
This module handles the core catalog hierarchy for the Top-up platform, defining what products can be sold and how they are categorized. The structure is heavily normalized to support complex supplier integrations (like uxiotopup).

## Architecture Stack
* **Framework:** Laravel 11
* **Pattern:** Action-Oriented Architecture (AOA) + DTOs
* **Database:** MySQL
* **Security:** Sanctum Authentication, Explicit Audit Trails

## Entity Relationships
1. **Category Types** (e.g., Mobile Games, Vouchers)
   └── **Categories** (e.g., Mobile Legends, Valorant)
       ├── **Sub Categories** (e.g., Diamonds, Twilight Passes)
       └── **Server Categories** (e.g., Regions)
           └── **Server Category Options** (e.g., Asia, Europe - specific supplier codes)

## Implementation Rules Enforced
1. **No Observers for Audit:** Activity logs are written explicitly within the Action classes (e.g., `CreateCategoryAction`) using `CreateActivityLogAction` to ensure rich, business-readable logs (e.g., *"Admin updated server option: Asia for Mobile Legends"*).
2. **Thin Controllers:** Controllers are restricted to HTTP routing, payload validation (via FormRequests), and DTO mapping.
3. **Cascading Deletes:** Deleting a `Category` will cascade and remove its associated `SubCategories` and `ServerCategories` to prevent orphaned data.
4. **Unique Identifiers:** The `code` field in the `Categories` table is strictly unique and acts as the primary mapping key against third-party suppliers.

## API Route Structure (Prefix: `/api/v1/`)
* `/category-types` (GET, POST, GET /{id}, PUT /{id}, DELETE /{id})
* `/categories` (GET, POST, GET /{id}, PUT /{id}, DELETE /{id})
* `/sub-categories` (GET, POST, GET /{id}, PUT /{id}, DELETE /{id})
* `/server-categories` (GET, POST, GET /{id}, PUT /{id}, DELETE /{id})
* `/server-category-options` (GET, POST, GET /{id}, PUT /{id}, DELETE /{id})

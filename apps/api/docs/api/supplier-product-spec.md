# Artifact: Supplier & Product API Specification

## Overview
This module handles the core inventory, multi-tier pricing strategies, and third-party supplier mappings (e.g., Digiflazz). It isolates our internal SKUs (`products`) from external provider SKUs (`supplier_products`), allowing seamless switching of providers without affecting the frontend user experience.

## Architecture Stack
* **Framework:** Laravel 11
* **Pattern:** Action-Oriented Architecture (AOA) + DTOs
* **Database:** MySQL
* **Security:** Sanctum Authentication, Explicit Audit Trails

## Entity Relationships & Strategy
1. **Suppliers:** Master data for external providers (e.g., Digiflazz, VIP Reseller).
2. **Supplier Categories:** Maps our internal `category_id` to the supplier's category code (e.g., Mobile Legends might be "MLBB" in Digiflazz).
3. **Products:** Our internal catalog with multi-tier pricing (`price_member`, `price_vip`, etc.). Uses a unique internal `code`.
4. **Supplier Products:** The bridge. Maps our internal `product_id` to the external `buyer_sku_code`.
   * **`is_active` Flag:** A single internal product can have multiple `supplier_products` attached, but only ONE can be `is_active = true` at a time. This dictates which supplier is currently fulfilling the order.

## Implementation Rules Enforced
1. **BigInt Currency:** All prices (`price_modal`, `price_member`, `price` in `supplier_products`) are explicitly cast and stored as `BigInt` to prevent floating-point calculation errors.
2. **Explicit Audit Trails:** No Observers. Actions log their own events contextually (e.g., *"Admin updated VIP price for 86 Diamond"*).
3. **Thin Controllers:** Strictly route logic and DTO transformations.

## API Route Structure (Prefix: `/api/v1/`)
* `/suppliers` (GET, POST, GET /{id}, PUT /{id}, DELETE /{id})
* `/supplier-categories` (GET, POST, GET /{id}, PUT /{id}, DELETE /{id})
* `/products` (GET, POST, GET /{id}, PUT /{id}, DELETE /{id})
* `/supplier-products` (GET, POST, GET /{id}, PUT /{id}, DELETE /{id})

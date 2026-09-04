# Artifact: Transactions & Payments API Specification

## Overview
This module acts as the central nervous system of the application. It orchestrates the creation of user orders, links them to exact payment bills (Monetapay), and prepares the data format required for supplier fulfillment (uxiolabs). 

## Architecture Stack
* **Framework:** Laravel 11
* **Pattern:** Action-Oriented Architecture (AOA) + DTOs
* **Database:** MySQL
* **Security:** Sanctum Authentication, Explicit Audit Trails

## Entity Relationships & Strategy
1. **Orders:** The master record of a purchase intent. Holds the `invoice_number` which acts as the ultimate source of truth.
2. **Payments:** A strictly 1-to-1 mapping to an Order.
   * **Separation of Concerns:** We separate `invoice_number` (Order) from `reference_id` (Payment). This allows a user to fail a payment (e.g., BCA VA expires) and generate a *new* Payment intent (e.g., using OVO) for the *same* Order without violating Monetapay's unique `mch_order_no` constraints.
   * **JSON Column:** Uses MySQL's native JSON column to dynamically store varying Monetapay responses (VA numbers, deep links, QR strings) without schema bloat.
3. **Point Histories & Ratings:** Auxiliary tracking for loyalty programs and product reputation.

## Implementation Rules Enforced
1. **Data Types:** BigInt for all monetary values. JSON for dynamic external gateway data.
2. **Standard Routing:** Strict adherence to standard route definitions over resource routes for granular middleware/permission control.
3. **Explicit Audit Trails:** Every status change is explicitly logged inside the Action classes. No implicit Observers allowed.

## API Route Structure (Prefix: `/api/v1/`)
* `/orders` (GET, POST, GET /{id}, PUT /{id}, DELETE /{id})
* `/payments` (GET, POST, GET /{id}, PUT /{id}, DELETE /{id})
* `/point-histories` (GET, POST, GET /{id}, PUT /{id}, DELETE /{id})
* `/ratings` (GET, POST, GET /{id}, PUT /{id}, DELETE /{id})

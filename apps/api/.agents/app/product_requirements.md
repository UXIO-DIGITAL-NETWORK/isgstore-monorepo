# Product Requirements Document (PRD): Core Top-up Platform (Laravel 13 & Headless API)

## 1. Functional Requirements

- **Hybrid API Engine:** Laravel 13 acts as a Headless API, serving both the React SPA (Admin/B2C) and the H2H APIs (B2B).
- **Supplier Redundancy:** The ability to switch suppliers (e.g., uxiolabs to an alternative) instantly via the admin dashboard to ensure zero downtime.
- **Tiered Pricing:** Prices automatically adjust based on the user's role (Member, VIP, Reseller, Agent) by applying dynamic margins to the supplier's base price.
- **Leaderboard System:** Displays "Top Spender" rankings efficiently utilizing the pre-calculated `user_spendings` aggregation table.

## 2. Tech Stack & Architecture Standards

- **Backend Framework:** Laravel 13 (API Mode / Headless)
- **Frontend Framework:** React.js / Next.js
- **Authentication:** Stateless JWT / Sanctum API Tokens (Access Token & Refresh Token Flow)

## 3. Security Requirements

- **Stateless Token Authentication:** Utilizes short-lived Access Tokens and long-lived, `HttpOnly` Refresh Tokens for secure admin dashboard sessions.
- **IP Whitelisting:** An additional security layer enforcing IP validation for all Reseller B2B API transaction routes.
- **Activity Logging:** An immutable audit trail that records every sensitive data modification executed by administrators.

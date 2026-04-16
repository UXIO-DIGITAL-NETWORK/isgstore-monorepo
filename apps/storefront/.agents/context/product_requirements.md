# Product Requirements Document (PRD): Multi-Game Top-Up Platform

**Platform:** Web Application (Responsive)
**Tech Stack:** Laravel / Node.js (Backend), React.js + TypeScript (Frontend), MySQL/PostgreSQL (Database), Tailwind CSS + Hero UI (Styling & UI Component).

## 1. Product Overview

This application is an _in-game currency_ (top-up) purchasing platform for various games (Multi-game). The main selling point of this platform is the ease and speed of transactions; users can instantly make purchases simply by entering their Game ID without being required to register or log in (Guest Checkout).
To maintain user retention, the system still provides Registration and Login features for users who want to permanently track their transaction history or gain member benefits (optional).

## 2. User Personas & Roles

**A. Super Admin**

- **Description:** Platform owner or manager.
- **Access Rights:** Has full access to the platform's main backend dashboard.
- **Main Tasks:** Add/edit the list of games, manage currency nominals (products), monitor all incoming transactions, and manage payment method integrations.

**B. Guest User (Non-Logged-in User)**

- **Description:** Casual users (primary clients) who want to perform a quick top-up.
- **Access Rights:** Can only access the homepage, checkout, and invoice tracking pages. Cannot view other users' data under any circumstances.
- **Main Tasks:** Select games, validate IDs, checkout, and pay for orders.

**C. Registered User (Member)**

- **Description:** Users who have registered an account on the platform.
- **Access Rights:** Has access to a personal Member Dashboard page.
- **Main Tasks:** View complete transaction history and save Game IDs (Contact Book) to avoid re-typing during future purchases.

## 3. System Workflows

**Workflow 1: Quick Purchase / Guest Checkout (Primary)**

1. User selects a game from the homepage and is directed to the game details page.
2. Fills in the User ID & Server ID form.
3. The system validates the account in real-time against the game server and retrieves the player's _Nickname_.
4. User selects the currency nominal from the interactive grid display.
5. Selects a payment method (Cash/E-Wallet/QRIS).
6. Enters a WhatsApp number and promo code (if any).
7. User clicks the "Pay Now" button.
8. The system saves the transaction, displays payment instructions, and monitors the status live. Items are automatically added upon successful payment.

**Workflow 2: Member Registration & Login**

1. User goes to the Sign Up page.
2. Fills in account credentials: Name, Email, WhatsApp, Password.
3. The system saves the User data.
4. Upon login, the user is redirected to the Member Dashboard to view transaction history or save game profiles.

## 4. Detailed Feature Specs

**Module 1: Catalog & Transactions (Global)**

- **Game List Grid:** Displays available games with a search feature.
- **Cashier / POS Interface (Checkout SPA):** Interactive interface without page reloads. State management for nominal selections and payment methods is handled using **Zustand**. Form validation (User ID, WA) is strictly managed using **React-Hook-Form + Zod**.
- **Real-time Nickname Validation:** Uses **TanStack Query** to call the ID validation API asynchronously (with a _debounce_).
- **Live Invoice Tracker:** Payment status checking (periodic polling) using **TanStack Query**.

**Module 2: Authentication & Security**

- **Register & Login:** Uses a Token / JWT system.
- **Protection Middleware:** _Route Guards_ in **TanStack Router** to prevent Guest Users from accessing the Member Dashboard, and vice versa.

**Module 3: Super Admin Dashboard**

- **Overview Metrics:** Displays statistics cards: Total Transactions, Total Revenue, Success/Failed Transactions.
- **Game & Product Management:** CRUD operations for game data and top-up price nominals.

---

## 5. Database Schema & Migration Brief

**Target Audience:** Backend Developer, Database Administrator
**Database System:** MySQL / PostgreSQL

### Table Specifications

**A. users table**

- `id`: bigint, Primary Key, Auto-increment
- `name`: string
- `email`: string, Unique
- `phone_number`: string, Nullable
- `password`: string
- `role`: enum or string, values: `['superadmin', 'member']`, Default: `'member'`
- `timestamps()`

**B. games table**

- `id`: bigint, Primary Key, Auto-increment
- `name`: string
- `publisher`: string, Nullable
- `thumbnail_url`: string
- `has_server_id`: boolean, Default: false
- `is_active`: boolean, Default: true
- `timestamps()`

**C. products table**

- `id`: bigint, Primary Key, Auto-increment
- `game_id`: foreignId, reference to `games(id)`, cascadeOnDelete
- `name`: string
- `price`: decimal(15, 2)
- `timestamps()`
- `softDeletes()`

**D. transactions table**

- `id`: bigint, Primary Key, Auto-increment
- `invoice_number`: string, Unique
- `user_id`: foreignId, reference to `users(id)`, nullable
- `game_id`: foreignId, reference to `games(id)`
- `product_id`: foreignId, reference to `products(id)`
- `target_user_id`: string
- `target_server_id`: string, nullable
- `target_nickname`: string, nullable
- `whatsapp_number`: string
- `total_amount`: decimal(15, 2)
- `payment_method`: string
- `status`: enum or string, values: `['pending', 'processing', 'success', 'failed']`, Default: `'pending'`
- `timestamps()`

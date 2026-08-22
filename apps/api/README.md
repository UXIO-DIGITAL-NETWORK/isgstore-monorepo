# Template API - Headless API Engine 🚀

Template for Headless API. Built with Laravel 13 and tailored for React/Next.js SPA clients and B2B/H2H Server-to-Server integrations.

## 🏗 Architectural Paradigm: Strict Action-Oriented

This project abandons the traditional "Fat Controller" MVC approach in favor of a **Strict Hybrid Action-Oriented Architecture**. This ensures maximum scalability, testability, and isolated business logic.

### The Sacred Data Flow

Every incoming HTTP request must follow this exact pipeline:

1. **HTTP Request** hits the API Route.
2. **FormRequest** validates the raw incoming data.
3. **Controller** maps the validated array into a strongly-typed **DTO (Data Transfer Object)**.
4. **Controller** injects the **Action Class** and passes the DTO to it.
5. **Action Class** executes the core business logic (e.g., DB transactions, external API calls to uxiotopup).
6. **Controller** returns a standardized JSON format using the `ApiResponse` trait or an `API Resource`.

---

## 📂 Directory Structure

We introduce custom directories to handle the decoupled logic:

```text
app/
├── Actions/       # Core business logic. 1 Class = 1 Task (e.g., ProcessUxiotopupTransactionAction)
├── DTOs/          # Readonly classes to ensure Type Safety from HTTP to Action.
├── Enums/         # Native PHP 8.1+ Enums for Statuses and Roles.
├── Http/
│   ├── Controllers/ # Thin routers. Strictly NO business logic here.
│   ├── Requests/    # Validation rules.
│   └── Resources/   # Data masking and formatting for JSON responses.
└── Traits/        # Global helpers (e.g., ApiResponse trait).
```

Sebagai Tech Lead, ini adalah langkah final yang sangat krusial sebelum kita masuk ke fase penulisan kode sesungguhnya. Kita butuh satu instruksi (prompt) yang sangat presisi agar agen AI (Gemini) tidak melenceng dari arsitektur yang sudah kita rancang dengan susah payah.

Berikut adalah prompt eksekusi yang bisa kamu copy-paste ke chat baru atau agen @developer untuk membuat fondasi template API ini, dilanjutkan dengan dokumentasi README.md standar Enterprise.

1. Prompt Eksekusi untuk Gemini / @developer
   Silakan salin teks di bawah ini dan berikan kepada agen AI untuk memulai pembuatan template kode:

Plaintext

# Role: Full-Stack Engineer (@developer)

**Task:** Scaffold the Core Headless API Template for "Laravel Template API" using Laravel 13.

**Context:** We are building an Enterprise-grade B2B/B2C Top-up Platform. The architecture MUST strictly follow a **Headless Hybrid Action-Oriented Pattern**. Controllers must be thin, business logic must be in Actions, and payloads must be mapped via DTOs. Authentication uses a Stateless Access & Refresh Token flow.

**Execution Steps (Please provide the exact PHP code and terminal commands for the following):**

1. **Global API Response Standardization:**
   - Create a trait `app/Traits/ApiResponse.php` with methods: `successResponse()`, `errorResponse()`, `validationErrorResponse()`.

2. **Directory Structure Setup:**
   - Define the commands or structure to create `app/Actions`, `app/DTOs`, and `app/Enums`.

3. **Stateless Authentication Flow (Access & Refresh Token):**
   - Create an Enum `app/Enums/RoleType.php` (Admin, Member, VIP, Reseller, Agent).
   - Create `LoginDTO` and `RefreshTokenDTO`.
   - Create `app/Actions/Auth/LoginAction.php`: Validates credentials and returns an Access Token (valid for 60 mins) and a Refresh Token (valid for 30 days, saved securely in the database/cache).
   - Create `app/Actions/Auth/RefreshTokenAction.php`: Validates the refresh token and issues a new Access Token.
   - Create an invokable API Controller `app/Http/Controllers/Api/AuthController.php` that uses the `ApiResponse` trait, accepts FormRequests, maps to DTOs, and triggers the Actions for `login`, `refresh`, and `logout`.

**Constraints:**

- DO NOT put business logic in the Controller.
- Ensure strict type-hinting (PHP 8.3+) and read-only properties for DTOs.
- Provide only production-ready code. No placeholder logic for the core Auth flow.

2. Dokumentasi Teknis (README.md)
   Dokumen ini wajib diletakkan di root direktori repositori Laravel kita agar setiap developer baru yang masuk (atau agen AI di masa depan) langsung paham cara kerja sistem ini.

Markdown

# Laravel Template API - Core API Engine 🚀

Enterprise-grade Headless API for Top-up & PPOB Aggregation. Built with Laravel 13 and tailored for React/Next.js SPA clients and B2B/H2H Server-to-Server integrations.

## 🏗 Architectural Paradigm: Strict Action-Oriented

This project abandons the traditional "Fat Controller" MVC approach in favor of a **Strict Hybrid Action-Oriented Architecture**. This ensures maximum scalability, testability, and isolated business logic.

### The Sacred Data Flow

Every incoming HTTP request must follow this exact pipeline:

1. **HTTP Request** hits the API Route.
2. **FormRequest** validates the raw incoming data.
3. **Controller** maps the validated array into a strongly-typed **DTO (Data Transfer Object)**.
4. **Controller** injects the **Action Class** and passes the DTO to it.
5. **Action Class** executes the core business logic (e.g., DB transactions, external API calls to uxiotopup).
6. **Controller** returns a standardized JSON format using the `ApiResponse` trait or an `API Resource`.

---

## 📂 Directory Structure

We introduce custom directories to handle the decoupled logic:

```text
app/
├── Actions/       # Core business logic. 1 Class = 1 Task (e.g., ProcessUxiotopupTransactionAction)
├── DTOs/          # Readonly classes to ensure Type Safety from HTTP to Action.
├── Enums/         # Native PHP 8.1+ Enums for Statuses and Roles.
├── Http/
│   ├── Controllers/ # Thin routers. Strictly NO business logic here.
│   ├── Requests/    # Validation rules.
│   └── Resources/   # Data masking and formatting for JSON responses.
└── Traits/        # Global helpers (e.g., ApiResponse trait).

🔐 Security & Authentication Flow
This API uses a Stateless Token mechanism designed for SPA (Single Page Applications) and B2B clients, prioritizing security against XSS and CSRF attacks.

Access Token: Short-lived token (15-60 mins) passed in the Authorization: Bearer header.

Refresh Token: Long-lived token (7-30 days) used to silently request new Access Tokens.

For React SPA: This token should be stored in an HttpOnly cookie.

For Mobile/B2B: This token is securely stored in device keystores or server environments.

Auth Endpoints
POST /api/v1/auth/login - Returns Access & Refresh tokens.

POST /api/v1/auth/refresh - Accepts a valid Refresh token and issues a new Access token.

POST /api/v1/auth/logout - Revokes current tokens.

🚀 Setup & Installation
Prerequisites:

PHP 8.3 or higher

Composer 2.x

PostgreSQL / MySQL

Steps:

Clone the repository.

Run composer install.

Copy .env.example to .env and configure your database credentials.

Generate the application key: php artisan key:generate.

Run migrations: php artisan migrate.

Serve the application: php artisan serve (or use Docker/Laravel Sail).

“Code is read much more often than it is written. Keep the Actions clean, keep the Controllers thin.” — Tech Lead


Dengan *prompt* dan dokumentasi di atas, repositori kita sudah memiliki standar operasional yang tidak bisa diganggu gugat.

Bagian mana dari arsitektur atau *flow login* ini yang ingin kita uji coba eksekusinya pertama kali setelah *template* ini di-*generate*?
```

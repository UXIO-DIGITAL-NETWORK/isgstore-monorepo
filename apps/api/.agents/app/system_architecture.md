# System Architecture: Headless Action-Oriented

**Architecture Type:** Headless API (Backend) + React SPA (Frontend)
**Pattern:** Strict Hybrid Action-Oriented Architecture

## 1. Data Flow Pipeline

**React Axios Payload** -> **API Route** -> **FormRequest (Validation)** -> **DTO (Typed Data)** -> **Action Class (Business Logic)** -> **Eloquent (Database)** -> **API Resource (JSON Response)**

## 2. Layer Definitions

- **DTO Layer (`app/DTOs`):** Ensures structural integrity, validates data types, and performs initial sanitization (e.g., standardizing locale, timezone, and formatting `0` to `62` for WhatsApp numbers).
- **Action Layer (`app/Actions`):** The absolute core and single source of truth for business logic. Each Action executes exactly one isolated task (Single Responsibility Principle).
- **Headless Controller:** Controllers act strictly as thin HTTP routers. They receive requests, map data to DTOs, invoke Actions, and return JSON.
- **Automation:** The Laravel Task Scheduler triggers specific Action classes daily at 00:00.

## 3. Deployment

- **Containerization:** Dockerized environment running PHP 8.3-FPM, Nginx, and PostgreSQL.
- **CI/CD:** Automated pipelines via GitHub Actions for seamless deployment.

## 4. Security & Infrastructure Guidelines

To ensure optimal performance and security for this decoupled stack:

- **Authentication Flow (Stateless):**
  - Use **Access Tokens** (short-lived, e.g., 15-60 minutes) to authenticate regular API requests via the `Authorization: Bearer <token>` header.
  - Use **Refresh Tokens** (long-lived, e.g., 7-30 days) stored securely in an `HttpOnly` cookie on the React client.
  - The frontend Axios instance must include an interceptor to automatically catch `401 Unauthorized` responses, hit the `/api/refresh-token` endpoint silently in the background, and retry the failed request with the newly issued Access Token.
- **CORS Configuration:** Strictly configure `config/cors.php` to allow credentials (necessary for the `HttpOnly` refresh token cookie) and restrict origins exclusively to the deployed React frontend domain.

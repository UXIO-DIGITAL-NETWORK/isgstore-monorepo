# Database Schema: Core Top-up Platform (Laravel 13 & Headless API)

#### 1. `roles` Table

| Column | Data Type | Key | Description                          |
| :----- | :-------- | :-- | :----------------------------------- |
| `id`   | BigInt    | PK  | Unique identifier.                   |
| `name` | String    | -   | Admin, Member, VIP, Reseller, Agent. |

#### 2. `users` Table (Laravel 13 Standard + Custom)

| Column     | Data Type | Key    | Description                 |
| :--------- | :-------- | :----- | :-------------------------- |
| `id`       | BigInt    | PK     | Unique identifier.          |
| `role_id`  | BigInt    | FK     | Relation to `roles.id`.     |
| `name`     | String    | -      | Full name.                  |
| `email`    | String    | Unique | Email address for login.    |
| `password` | String    | -      | Hashed password.            |
| `phone`    | String    | -      | Sanitized WhatsApp number.  |
| `balance`  | Decimal   | -      | Digital wallet balance.     |
| `point`    | Integer   | -      | Loyalty stars/points.       |
| `locale`   | String    | -      | Default: 'id' (Indonesian). |
| `timezone` | String    | -      | Default: 'Asia/Jakarta'.    |

> _Note: This schema also includes Categories, Products, Supplier_Products (Digiflazz), and Payments (Midtrans) tables as defined in previous technical specifications._

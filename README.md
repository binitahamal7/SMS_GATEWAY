# SMS Gateway

A backend for sending SMS messages to Nepali phone numbers. Users register, log in with a JWT, and send messages that are paid for with credits. Each message goes out through mock SMS provider "routes" in priority order. If one route fails, the next one is tried. If every route fails, the user gets their credits back.

## Features

- **User accounts**: register and log in, with passwords hashed by bcrypt and authentication by JWT.
- **Credit wallet**: every new user starts with 100 credits. Sending costs one credit per SMS part per recipient.
- **SMS part counting**: detects GSM-7 or Unicode (for example Nepali) and counts the parts:
  - GSM-7: up to 160 characters is 1 part, longer messages use 153 characters per part.
  - Unicode: up to 70 characters is 1 part, longer messages use 67 characters per part.
- **Phone validation**: accepts 10-digit numbers starting with `97` or `98`, with or without a `+977` / `977` prefix.
- **Atomic charging**: credits are deducted and messages created in a single database transaction, so a user can never go below zero.
- **Route failover**: messages are tried on routes in `priority` order (`ROUTE_A`, then `ROUTE_B`). Each route has its own balance and a simulated failure rate.
- **Refunds**: if every route fails, the message is marked `FAILED` and its cost is returned to the user.
- **Health check**: `GET /health` confirms the database connection.

## Tech stack

| Layer     | Tool                                                        |
| --------- | ----------------------------------------------------------- |
| Runtime   | Node.js (ES modules)                                        |
| Framework | Express 5                                                   |
| Database  | PostgreSQL (local or cloud, e.g. [Neon](https://neon.tech)) |
| ORM       | Prisma 6                                                    |
| Auth      | jsonwebtoken + bcrypt                                       |
| Tests     | Vitest                                                      |

## Project structure

```
SMS_GATEWAY/
└── backend/
    ├── index.js                  # Express app, route mounting, /health
    ├── config/prisma.js          # Shared Prisma client
    ├── controllers/
    │   ├── user.controller.js    # Register and login
    │   └── sms.controller.js     # Send SMS: validation, charging, failover, refunds
    ├── middleware/
    │   └── auth.middleware.js    # Verifies the Bearer JWT
    ├── helpers/
    │   ├── phoneValidator.js     # Nepali phone number validation
    │   └── smsCounter.js         # Encoding detection and part counting
    ├── providers/
    │   └── mockSmsProvider.js    # Fake SMS provider (random failures, route balance)
    ├── routes/
    │   ├── user.routes.js
    │   └── sms.routes.js
    ├── prisma/
    │   ├── schema.prisma         # User, Route, Message models
    │   ├── migrations/           # Database migrations
    │   └── seed.js               # Seeds ROUTE_A and ROUTE_B
    ├── prisma.config.ts          # Prisma config (schema, migrations, seed)
    ├── tests/                    # Vitest unit tests
    └── .env.example              # Environment variable template
```

## Prerequisites

- **Node.js 22.12 or newer** (required by Vitest 5). Check with `node -v`.
- **npm** (comes with Node.js).
- **A PostgreSQL database**. Either:
  - a free cloud database from [Neon](https://neon.tech) (no install needed), or
  - PostgreSQL installed locally.

## Setup

### 1. Clone the repository and install dependencies

```bash
git clone <your-repo-url> SMS_GATEWAY
```

```bash
cd SMS_GATEWAY/backend
```

```bash
npm install
```

### 2. Create a PostgreSQL database

**Option A: Neon (cloud)**

1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Copy the connection string from the dashboard. It looks like
   `postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`.

**Option B: Local PostgreSQL**

Create a database, for example:

```bash
createdb sms_gateway
```

Your connection string will look like
`postgresql://postgres:yourpassword@localhost:5432/sms_gateway` (no `sslmode` needed locally).

### 3. Configure environment variables

Copy the template and fill in your own values:

```bash
cp .env.example .env
```

| Variable       | Description                                 | Example                                   |
| -------------- | ------------------------------------------- | ----------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma | `postgresql://USER:PASSWORD@HOST:5432/DB` |
| `JWT_SECRET`   | Secret used to sign and verify login tokens | a long random string                      |
| `PORT`         | Port the API listens on                     | `3000`                                    |

To generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> `.env` is git-ignored. Never commit real credentials.

### 4. Run the database migrations

This creates the `User`, `Route` and `Message` tables and generates the Prisma client:

```bash
npm run prisma:migrate
```

If you only need to regenerate the Prisma client (for example after `npm install`):

```bash
npm run prisma:generate
```

### 5. Seed the SMS routes

Sending SMS needs at least one route in the database. The seed script adds two mock routes:

| Route     | Priority | Balance | Failure rate |
| --------- | -------- | ------- | ------------ |
| `ROUTE_A` | 1        | 1000    | 30%          |
| `ROUTE_B` | 2        | 700     | 10%          |

```bash
npx prisma db seed
```

The seed uses `upsert`, so running it again resets these routes to the values above.

### 6. Start the server

Development mode (restarts when files change):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

You should see `Server is running at port 3000`. Check the database connection:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{ "status": "ok", "database": "connected" }
```

## API reference

Base URL: `http://localhost:<PORT>`

Protected routes need the header `Authorization: Bearer <token>`, using the token returned by login.

| Method | Endpoint              | Auth | Description                        |
| ------ | --------------------- | ---- | ---------------------------------- |
| GET    | `/health`             | No   | Check the server and database      |
| POST   | `/api/users/register` | No   | Create a user account              |
| POST   | `/api/users/login`    | No   | Log in and receive a JWT           |
| GET    | `/api/users/profile`  | Yes  | Return the authenticated user      |
| POST   | `/api/sms/send`       | Yes  | Send an SMS to one or more numbers |

### Register

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "secret123"}'
```

Responses: `201` created, `400` missing email or password, `409` email already exists.

### Login

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "secret123"}'
```

`200` response:

```json
{
  "message": "Login completed successfully",
  "token": "<JWT>",
  "user": { "id": 1, "email": "test@example.com", "createdAt": "..." }
}
```

`401` means the email or password is wrong.

### Profile

```bash
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <JWT>"
```

### Send SMS

```bash
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{"to": ["9812345678", "+9779712345678"], "message": "Hello from SMS Gateway"}'
```

Request body:

| Field     | Type       | Rules                                                                                |
| --------- | ---------- | ------------------------------------------------------------------------------------ |
| `to`      | `string[]` | Non-empty array of numbers starting with `97` / `98`, optional `+977` / `977` prefix |
| `message` | `string`   | Required, not blank                                                                  |

`200` response:

```json
{
  "totalCost": 2,
  "results": [
    { "to": "9812345678", "status": "SENT", "tried": ["ROUTE_A"] },
    {
      "to": "9712345678",
      "status": "FAILED",
      "tried": ["ROUTE_A", "ROUTE_B"],
      "refunded": 1
    }
  ]
}
```

- `tried` lists the routes attempted, in order.
- `refunded` is present only when every route failed, and shows how many credits were returned.

Error responses:

| Status | Meaning                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| `400`  | `to` is not a non-empty array, `message` is missing, or some numbers are invalid (listed in `invalidNumbers`) |
| `401`  | Missing or invalid token                                                                                      |
| `402`  | Not enough credits for `parts × recipients`                                                                   |
| `500`  | Unexpected server error                                                                                       |

### How sending works

1. The request body and every phone number are validated. One invalid number rejects the whole request.
2. The cost is calculated: `parts(message) × number of recipients`.
3. In one transaction, the credits are deducted (only if the balance covers the cost) and a `PENDING` message row is created for each recipient.
4. For each message, routes are tried in priority order. A route fails if its balance is too low or its random failure check triggers. On success, the route's balance is reduced and the message becomes `SENT`.
5. If every route fails, the message becomes `FAILED` and its parts are refunded to the user.

## Running tests

Unit tests cover the phone validator and the SMS part counter. They do not need a database.

Watch mode (re-runs on file changes):

```bash
npm test
```

Run once and exit:

```bash
npx vitest run
```

## Troubleshooting

- **`/health` returns `database: "not connected"`**: check `DATABASE_URL` in `.env`. Cloud databases such as Neon need `?sslmode=require` at the end.
- **`@prisma/client did not initialize yet`**: run `npm run prisma:generate`.
- **`invalid or expired token`**: make sure the header is `Authorization: Bearer <token>`, with a space after `Bearer`, and that `JWT_SECRET` has not changed since you logged in (tokens do not expire, but changing the secret invalidates them).
- **Every SMS fails**: make sure the routes are seeded (`npx prisma db seed`) and still have balance. Run the seed again to reset them.
- **Server logs `undefined` as the port**: `PORT` is missing from `.env`.

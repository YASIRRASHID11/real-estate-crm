# PropCRM — Real Estate CRM Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL (local or cloud)
- npm

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your actual values
```

Required `.env` values:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/propcrm"
JWT_SECRET="your-random-32-char-secret-key-here"
JWT_REFRESH_SECRET="another-random-32-char-secret-key"
```

### 3. Generate Prisma client & push schema
```bash
npm run db:generate   # Generate Prisma types
npm run db:push       # Push schema to database
```

### 4. Seed demo data
```bash
npm run db:seed
```

Demo credentials after seeding:
| Role         | Email                   | Password   |
|--------------|-------------------------|------------|
| Admin        | admin@propcrm.com       | Admin@123  |
| Sales Manager| manager@propcrm.com     | Admin@123  |
| Agent 1      | agent1@propcrm.com      | Admin@123  |
| Agent 2      | agent2@propcrm.com      | Admin@123  |

### 5. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel + Supabase)

### Database — Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → Database → Connection string (URI)
3. Copy the connection URL into `DATABASE_URL`

### Deploy — Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

Add environment variables in Vercel dashboard:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `NEXT_PUBLIC_APP_URL` = your Vercel domain

---

## Architecture Overview

```
real-estate-crm/
├── prisma/
│   ├── schema.prisma        # Complete DB schema with 15 models
│   └── seed.ts              # Demo data seeder
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, Register pages
│   │   ├── (dashboard)/     # All CRM pages
│   │   │   ├── dashboard/   # KPI + charts
│   │   │   ├── leads/       # Lead management
│   │   │   ├── properties/  # Property inventory
│   │   │   ├── customers/   # Customer profiles
│   │   │   ├── deals/       # Sales pipeline
│   │   │   ├── tasks/       # Task management
│   │   │   ├── reports/     # Analytics & reports
│   │   │   ├── users/       # User management
│   │   │   ├── documents/   # Document storage
│   │   │   └── settings/    # CRM settings
│   │   └── api/             # REST API routes
│   ├── components/
│   │   ├── layout/          # Sidebar, Header
│   │   ├── dashboard/       # Stat cards
│   │   ├── leads/           # Lead forms
│   │   └── shared/          # DataTable, Badge, EmptyState
│   ├── lib/
│   │   ├── auth.ts          # JWT + bcrypt utilities
│   │   ├── db.ts            # Prisma client singleton
│   │   └── utils.ts         # Helpers, formatters
│   ├── store/               # Zustand state (auth, ui)
│   ├── hooks/               # useApi, useFetch
│   ├── types/               # TypeScript types
│   ├── validations/         # Zod schemas
│   ├── constants/           # Labels, colors, options
│   └── middleware.ts        # JWT route protection
```

## API Endpoints

| Method | Endpoint              | Description              | Auth |
|--------|----------------------|--------------------------|------|
| POST   | /api/auth/login      | Login, get JWT cookies   | No   |
| POST   | /api/auth/register   | Create account           | No   |
| POST   | /api/auth/logout     | Clear cookies            | Yes  |
| POST   | /api/auth/refresh    | Refresh access token     | No   |
| GET    | /api/leads           | List leads (paginated)   | Yes  |
| POST   | /api/leads           | Create lead              | Yes  |
| GET    | /api/leads/:id       | Lead detail + timeline   | Yes  |
| PATCH  | /api/leads/:id       | Update lead              | Yes  |
| DELETE | /api/leads/:id       | Soft delete              | Admin|
| GET    | /api/properties      | List properties          | Yes  |
| POST   | /api/properties      | Create property          | Yes  |
| GET    | /api/properties/:id  | Property detail          | Yes  |
| PATCH  | /api/properties/:id  | Update property          | Yes  |
| GET    | /api/customers       | List customers           | Yes  |
| POST   | /api/customers       | Create customer          | Yes  |
| GET    | /api/deals           | List deals               | Yes  |
| POST   | /api/deals           | Create deal              | Yes  |
| GET    | /api/tasks           | List tasks               | Yes  |
| POST   | /api/tasks           | Create task              | Yes  |
| PATCH  | /api/tasks/:id       | Update task status       | Yes  |
| GET    | /api/users           | List users (Admin only)  | Admin|
| POST   | /api/users           | Create user (Admin only) | Admin|
| GET    | /api/reports         | Dashboard/revenue/agents | Yes  |

## Role-Based Access

| Feature        | Super Admin | Admin | Manager | Agent | Accountant |
|----------------|-------------|-------|---------|-------|------------|
| All leads      | ✅          | ✅    | ✅      | Own   | ❌         |
| All deals      | ✅          | ✅    | ✅      | Own   | Read       |
| User mgmt      | ✅          | ✅    | ❌      | ❌    | ❌         |
| Reports        | ✅          | ✅    | Read    | ❌    | Read       |
| Properties     | ✅          | ✅    | Read    | Read  | ❌         |

## Future Integrations (Architecture Ready)

- **WhatsApp**: `lib/whatsapp.ts` — use Twilio/Meta API, trigger on lead status change
- **SMS**: `lib/sms.ts` — use MSG91/Fast2SMS
- **Email**: `lib/email.ts` — use Nodemailer/Resend/SendGrid
- **Cloudinary**: For property image uploads (API route at `/api/upload`)
- **AI Lead Scoring**: Train model on lead → deal conversion data
- **Multi-tenant**: Add `tenantId` FK to all models + subdomain routing

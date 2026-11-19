# HelpDesk - Customer Support Ticketing System

A modern, full-stack customer support ticketing system built with Next.js 16, featuring role-based access control, real-time updates, and automated email notifications.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![TiDB](https://img.shields.io/badge/TiDB-Serverless-orange)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)

## 🌟 Features

### Core Functionality
- **Multi-role authentication** (Admin, Agent, Customer) with JWT + rotating refresh tokens
- **Ticket lifecycle management** with state machine enforcement (open → in_progress → resolved → closed)
- **Real-time comments** with public/internal note distinction
- **Category-based organization** for ticket classification
- **Dashboard analytics** showing open tickets, unassigned count, resolved today, and priority breakdown

### Advanced Features
- **Automated email notifications** via Brevo SMTP:
  - Ticket assignment alerts to agents
  - Status change notifications to customers
  - Daily digest summaries for staff
- **Cache Components** for optimized performance:
  - `"use cache"` directive for read operations
  - `revalidateTag` for targeted cache invalidation
  - `revalidatePath` for route-specific refresh
- **Server/client component separation** for optimal hydration
- **Playwright E2E testing** covering auth, authorization, business logic, and mobile viewports

### Admin Capabilities
- User management (create, deactivate, delete)
- Category CRUD operations
- Ticket assignment and status transitions
- Self-protection: admins cannot deactivate themselves

### Security
- Role-based access control (RBAC)
- State machine enforcement prevents invalid transitions (422 errors)
- Cross-user data isolation
- CSRF protection via SameSite cookies
- Rate limiting ready (via Vercel)

## 🚀 Tech Stack

### Frontend
- **Next.js 16.4.6** with App Router and Turbopack
- **React 19** with Server Components
- **Tailwind CSS** for styling
- **Playwright** for E2E testing

### Backend
- **Next.js API Routes** with edge runtime support
- **Zod** for schema validation
- **bcryptjs** for password hashing
- **jose** for JWT handling

### Database
- **TiDB Cloud Serverless** (MySQL-compatible)
- **Drizzle ORM** with type-safe queries
- **Cache Components** for optimized reads

### Infrastructure
- **Vercel** for deployment
- **Brevo** for transactional emails
- **GitHub Actions** for CI/CD

## 📋 Prerequisites

- Node.js 18+
- npm 9+
- TiDB Cloud account (free tier available)
- Brevo account for email (optional, gracefully degrades)

## 🛠️ Setup

### 1. Clone and install

```bash
git clone https://github.com/yourusername/helpdesk-next.git
cd helpdesk-next
npm install
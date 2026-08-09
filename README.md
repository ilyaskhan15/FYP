<div align="center">

# 🛍️ NOVA STORE

**A Full-Featured E-Commerce Platform Built with Modern Web Technologies**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma)](https://www.prisma.io/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-18181b?logo=shadcnui)](https://ui.shadcn.com/)

[Features](#-features) • [Demo Accounts](#-demo-accounts) • [Getting Started](#-getting-started) • [Tech Stack](#-tech-stack) • [Project Structure](#-project-structure) • [Architecture](#-architecture) 
</div>

---

## ✨ Features

### 🛒 Storefront
- **Homepage** — Hero banner, featured products, new arrivals, customer testimonials, and newsletter signup
- **Shop Page** — Full product catalog with category filtering, price range, brand, rating, and sort options
- **Product Detail** — Rich product pages with image gallery, variants, reviews, and related products
- **Search** — Real-time search with autocomplete suggestions and recent search history
- **Cart** — Slide-out cart drawer with quantity management and coupon code support
- **Checkout** — Multi-step checkout with address management and order summary
- **Product Comparison** — Compare up to 4 products side-by-side
- **Wishlist** — Per-user wishlist with heart icon toggles across the entire store
- **Dark Mode** — Full light/dark theme support with system preference detection
- **Responsive Design** — Mobile-first design that works on all screen sizes

### 👤 Customer Account
- **Profile Management** — Update name, email, and account details
- **Order History** — Track all orders with status updates
- **Address Book** — Manage multiple shipping addresses
- **Wishlist** — View and manage saved products
- **Reviews** — Write and manage product reviews
- **Upgrade to Seller** — One-click seller account application with admin approval flow

### 🏪 Seller Dashboard
- **Dashboard Analytics** — Sales overview, order stats, and revenue metrics
- **Product Management** — Full CRUD for products (create, edit, and permanently delete)
- **Order Management** — View and track orders placed on your products
- **Store Settings** — Customize store name, description, logo, banner, and payment info
- **Approval System** — New sellers require admin approval before listing products

### 🛡️ Admin Panel
- **Dashboard** — Platform-wide analytics with charts and KPIs
- **Product Management** — Full CRUD with category assignment and rich editing
- **Category Management** — Hierarchical category tree with product counts
- **Order Management** — View, filter, and update order statuses
- **Review Moderation** — Approve, reject, or delete customer reviews
- **Coupon Management** — Create and manage discount coupons
- **User Management** — View users, ban/unban accounts
- **Seller Approvals** — Review and approve/reject seller account applications with pending count badge

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@store.com` | `admin123` |
| **Customer** | `demo@store.com` | `demo123` |
| **Seller** | `seller@store.com` | `seller123` |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/)
- [Git](https://git-scm.com/)

### Installation

```bash
# Clone the repository
 git clone https://github.com/your-username/nova-store.git
 cd nova-store

# Install dependencies
 npm install
# or: bun install

# Set up the database
 npx prisma db push

# (Optional) Seed the database with sample products
 npx prisma db seed

# Start the development server
 npm run dev
# or: bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run lint` | Run ESLint for code quality checks |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

---

## 🏗️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui (New York) |
| **Database** | SQLite via Prisma ORM 6 |
| **State Management** | Zustand (client), TanStack Query (server) |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Theming** | next-themes (light/dark) |
| **Notifications** | Sonner (toast) |
| **Drag & Drop** | dnd-kit |

---

## 📁 Project Structure

```
nova-store/
├── prisma/
│   ├── schema.prisma          # Database schema (10 models)
│   └── seed.ts                # Sample data seeder
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Single-page app entry + view router
│  │   ├── globals.css           # Global styles
│   │   ├── nova-source-code/
│   │   │   └── route.ts        # Source code download endpoint
│   │   └── api/
│   │       ├── auth/route.ts               # Login, register, seller upgrade
│   │       ├── products/route.ts           # Product listing & search
│   │       ├── products/[id]/route.ts      # Single product
│   │       ├── categories/route.ts         # Category listing
│   │       ├── wishlist/route.ts           # Wishlist CRUD
│   │       ├── orders/route.ts             # Order creation (checkout)
│   │       ├── coupons/route.ts            # Coupon validation
│   │       ├── search/route.ts             # Product search
│   │       ├── newsletter/route.ts         # Newsletter subscription
│   │       ├── reviews/route.ts            # Public reviews
│   │       ├── admin/
│   │       │   ├── dashboard/route.ts      # Admin stats
│   │       │   ├── analytics/route.ts      # Analytics data
│   │       │   ├── products/route.ts       # Admin product CRUD
│   │       │   ├── products/[id]/route.ts  # Admin single product
│   │       │   ├── categories/route.ts     # Category CRUD
│   │       │   ├── categories/[id]/route.ts
│   │       │   ├── orders/route.ts         # Order management
│   │       │   ├── users/route.ts          # User management
│   │       │   ├── reviews/route.ts        # Review moderation
│   │       │   ├── reviews/[id]/route.ts
│   │       │   ├── coupons/[id]/route.ts   # Coupon management
│   │       │   └── seller-approvals/route.ts # Seller approval
│   │       └── seller/
│   │           ├── dashboard/route.ts      # Seller stats
│   │           ├── products/route.ts       # Seller product CRUD
│   │           ├── products/[id]/route.ts  # Seller single product
│   │           ├── orders/route.ts         # Seller orders
│   │           └── profile/route.ts        # Seller settings
│   ├── components/
│   │   ├── ui/                   # 42 shadcn/ui primitives
│   │   ├── storefront/           # Storefront components (12 files)
│   │   ├── account/              # Account pages (6 files)
│   │   ├── admin/                # Admin panel (10 files)
│   │   └── seller/               # Seller dashboard (5 files)
│   ├── stores/
│   │   ├── auth.ts               # User authentication state
│   │   ├── cart.ts               # Shopping cart state
│   │   ├── comparison.ts         # Product comparison state
│   │   └── navigation.ts         # SPA view router state
│   ├── hooks/
│   │   ├── use-mobile.ts         # Responsive breakpoint hook
│   │   └── use-toast.ts          # Toast state hook
│   └── lib/
│       ├── db.ts                 # Prisma client singleton
│       ├── utils.ts              # Utility functions
│       ├── format.ts             # Currency formatter
│       └── query-provider.tsx    # React Query provider
├── public/                       # Static assets
├── db/                           # SQLite database file
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── Caddyfile                     # Reverse proxy config
```

---

## 🧩 Architecture

NOVA Store uses a **single-page application (SPA) pattern** inside Next.js:

- **One route, many views** — All UI is rendered from `src/app/page.tsx` using a Zustand-based view router (`useNavigationStore`). The `currentView` state determines which component is displayed.
- **RESTful API layer** — All data operations go through Next.js API routes under `src/app/api/`.
- **State separation** —
  - **Zustand** manages client-side state (auth, cart, navigation, comparison) with localStorage persistence
  - **TanStack Query** handles server state (products, orders, wishlist) with caching and automatic refetching
- **Three user roles** — Customer, Seller, and Admin each have dedicated layouts, navigation, and feature sets.
- **Seller approval flow** — Buyers can apply to become sellers. An admin must approve the application before the seller can list products.

### Database Schema

The database has **10 models** with full relational integrity:

```
User → Address, Order, Review, Wishlist, Cart, SellerProfile
SellerProfile → Product
Product → ProductVariant, Review, Wishlist, OrderItem, Cart
Category → Product (self-referential hierarchy)
Order → OrderItem
OrderItem → Product, ProductVariant
```

---

<div align="center">
  <p>Built with ❤️ using Next.js, TypeScript, and Tailwind CSS</p>
</div>

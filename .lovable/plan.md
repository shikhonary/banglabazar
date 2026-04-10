

# Multi-Tenant SaaS Plan for Union Parishad Holding Card Manager

## Current State

Single-tenant app: one user signs up, manages their own holding cards. No concept of organizations, subscriptions, or admin roles. Hardcoded union name ("৪নং ফুলসুতী ইউনিয়ন পরিষদ") throughout cards and invoices.

## Target State

Multi-tenant SaaS where each Union Parishad secretary signs up, configures their union details, and manages holding cards for their union. You (the platform owner) can manage subscriptions and billing.

---

## Architecture

```text
┌─────────────────────────────────────────────┐
│  Super Admin (You)                          │
│  - Manage all unions, subscriptions, plans  │
└─────────┬───────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────┐
│  Tenant: Union Parishad (Organization)      │
│  - union_name, upazila, district, logo, etc │
│  - subscription_status, plan                │
│  - Owner = Secretary who signed up          │
│  └── Members (optional future feature)      │
│      └── Holding Cards (scoped to union)    │
└─────────────────────────────────────────────┘
```

---

## Phase 1: Database Schema Changes

### 1.1 New table: `organizations`
Represents each Union Parishad tenant.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| owner_id | uuid (FK auth.users) | Secretary who created it |
| union_name | text | e.g. "৪নং ফুলসুতী ইউনিয়ন পরিষদ" |
| upazila | text | |
| district | text | |
| division | text | (optional) |
| logo_url | text | Custom logo (optional) |
| website_url | text | (optional) |
| phone | text | (optional) |
| subscription_status | text | 'trial', 'active', 'expired', 'cancelled' |
| subscription_plan | text | 'free', 'basic', 'premium' |
| trial_ends_at | timestamptz | 14-day free trial |
| max_holdings | int | Limit per plan |
| created_at / updated_at | timestamptz | |

### 1.2 New table: `organization_members`
Maps users to organizations (for future multi-user support).

| Column | Type |
|--------|------|
| id | uuid PK |
| organization_id | uuid FK |
| user_id | uuid FK auth.users |
| role | text ('owner', 'secretary', 'member') |
| created_at | timestamptz |

### 1.3 Modify `holding_cards`
- Add `organization_id` (uuid FK organizations, NOT NULL)
- Update RLS policies to scope by organization membership instead of just user_id

### 1.4 New table: `user_roles` (for super admin)
Per security guidelines, roles stored separately.

| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK auth.users |
| role | app_role enum ('admin', 'user') |

### 1.5 RLS Policies
- `organizations`: owners can CRUD their own; super admins can read all
- `organization_members`: scoped to organization owner + super admin
- `holding_cards`: members of the organization can CRUD; public SELECT for invoice view remains
- Security definer function `has_role()` for admin checks

---

## Phase 2: Onboarding Flow

After signup, users must create/configure their organization before accessing the dashboard:

1. **Setup Wizard page** (`/setup`) — collect union name, upazila, district, phone, optional logo upload
2. Auto-create `organizations` row + `organization_members` row (role: 'owner')
3. Redirect to dashboard
4. If user has no organization, always redirect to `/setup`

### Storage
- Create a `logos` storage bucket for union logos

---

## Phase 3: Tenant-Scoped App Changes

### 3.1 Context: `OrganizationContext`
- Fetches the current user's organization on load
- Provides `organization` object to all components
- Redirects to `/setup` if no organization exists

### 3.2 Dynamic Branding
Replace all hardcoded union names/details:
- **HoldingCardFront.tsx**: union name, upazila, district from organization context
- **PublicInvoice.tsx**: same dynamic values
- **DashboardLayout.tsx**: show organization name in header
- **AppSidebar.tsx**: show union name

### 3.3 Data Scoping
All queries filtered by `organization_id`:
- `HoldingList.tsx`, `Index.tsx`, `AddHolding.tsx`, `EditHolding.tsx`, `ImportHoldings.tsx`
- Insert operations include `organization_id`

### 3.4 Organization Settings Page
New page (`/settings`) to edit union details, upload logo, view subscription status.

---

## Phase 4: Subscription & Plan Management

### 4.1 Plan Tiers
| Feature | Free/Trial | Basic | Premium |
|---------|-----------|-------|---------|
| Holdings limit | 50 | 500 | Unlimited |
| Export/Download | Yes | Yes | Yes |
| Custom logo on cards | No | Yes | Yes |
| Trial period | 14 days | - | - |

### 4.2 Subscription Enforcement
- Check `subscription_status` and `max_holdings` before allowing new holding creation
- Show upgrade prompts when limits are reached
- Show trial expiry countdown on dashboard

### 4.3 Payment Integration (future)
- Stripe integration for collecting payments (can be added later)
- For now, super admin manually manages subscription status

---

## Phase 5: Super Admin Panel

### 5.1 Admin Routes (`/admin/*`)
- **Dashboard**: total unions, total holdings, revenue overview
- **Union List**: view all organizations, their subscription status, holding counts
- **Manage Subscription**: change plan/status for any organization
- Protected by `has_role(auth.uid(), 'admin')` check

### 5.2 Admin Sidebar
Separate sidebar items for admin pages, only visible to admin users.

---

## Phase 6: New Routes & Navigation

```text
/auth              — Login/Register (existing)
/setup             — Organization onboarding wizard (new)
/                  — Dashboard (existing, scoped to org)
/holdings          — Holding list (existing, scoped)
/holdings/add      — Add holding (existing, scoped)
/holdings/edit/:id — Edit (existing, scoped)
/holdings/card/:id — Card view (existing, scoped)
/holdings/import   — Import (existing, scoped)
/settings          — Organization settings (new)
/admin             — Super admin dashboard (new)
/admin/unions      — All unions list (new)
/invoice/:id       — Public invoice (existing)
```

---

## Implementation Order

1. **Database migrations** — organizations, organization_members, user_roles tables; alter holding_cards; RLS policies; storage bucket
2. **OrganizationContext + onboarding wizard** — setup flow after signup
3. **Scope all existing pages** — filter by organization_id, dynamic branding
4. **Organization settings page** — edit union details
5. **Subscription enforcement** — plan limits, trial logic
6. **Super admin panel** — admin dashboard and union management
7. **Testing end-to-end** — signup → setup → add holdings → view cards

---

## Technical Notes

- All existing holding_cards will need a migration to assign an organization_id (can default to a "legacy" org for your existing data)
- Logo upload uses a Lovable Cloud storage bucket
- RLS uses security definer functions to avoid recursive policies
- Organization context wraps DashboardLayout, checked before rendering any protected route


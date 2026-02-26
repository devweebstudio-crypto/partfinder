## partfinder

A minimal event vendor finder built with Vite + React + TypeScript.

## About

This repo contains the frontend for PartFinder — a map-based vendor discovery app.

## Quick start

1. Install dependencies

```powershell
npm install
```

2. Run dev server

```powershell
npm run dev
```

3. Build for production

```powershell
npm run build
```

## Deploying to GitHub

I will provide commands to force-push a fresh history to https://github.com/devweebstudio-crypto/partfinder.

Warning: those commands permanently replace the remote history — only run them if you understand and accept that.

## License

Add your project license here.
# PartFinder - Project Documentation

## Overview
PartFinder is a full-stack web application that connects auto part seekers with local vendors. Clients post part requests with location and detail constraints. Vendors review incoming requests, respond (accept, reject, or complete), and clients manage their request lifecycle. The platform uses Supabase for authentication, data storage, file storage, and real-time notifications.

## Goals and Principles
- Match local vendors to part requests quickly with location-aware filtering.
- Keep the request lifecycle clear for clients and vendors.
- Use real-time notifications for timely responses.
- Enforce access rules with database-level row-level security (RLS).

## Tech Stack
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Supabase (PostgreSQL, Auth, Realtime)
- Storage: Supabase Storage (request images)
- Maps: OpenStreetMap with Leaflet and react-leaflet

## Architecture Summary
- Client app renders routes with role-aware guards.
- Auth state is centralized in an `AuthProvider` context.
- Supabase handles persistence, auth, storage, and realtime events.
- Notifications are written to a `notifications` table and delivered via Supabase Realtime.
- Location filtering is handled client-side for vendor visibility on requests.

## Application Routes
- `/`: Public landing page
- `/auth`: Login and signup (role selection for signup)
- `/vendors`: Public vendor directory and map
- `/dashboard`: Role-specific dashboard
- `/request/new`: Client request creation
- `/vendor/request`: Vendor request creation (vendor-to-vendor)
- `/profile/edit`: Profile editing
- `/faq`, `/privacy`, `/terms`, `/contact`: Informational pages

## User Roles
### Client
- Creates part requests with location and radius constraints.
- Tracks request status and vendor responses.
- Closes requests when resolved.

### Vendor
- Views client requests that match location filters.
- Responds with accept, reject, or complete.
- Can create vendor-to-vendor requests.

### Admin
- Views platform statistics and lists of vendors/requests.
- Role is assigned manually by updating the profile record.

## Workflow Details
### Authentication and Profile Creation
1. User signs up on `/auth` and selects a role (client or vendor).
2. Supabase Auth creates the user.
3. A profile record is inserted into `profiles` with role-specific fields.
4. `AuthProvider` fetches and caches the profile for role-based routing.

### Client Request Lifecycle
1. Client opens `/request/new` and fills out request details.
2. Optional image is uploaded to Supabase Storage (`request-images`).
3. Request is saved in `requests` with status `open`.
4. Nearby vendors are determined based on radius, city, state, or all-India scope.
5. Notifications are inserted for matching vendors.
6. Vendors respond with `accepted`, `rejected`, or `completed` statuses.
7. Client closes the request, which updates status to `closed` and notifies accepted vendors.

### Vendor Request Lifecycle (Vendor-to-Vendor)
1. Vendor creates a request via `/vendor/request`.
2. Request is saved with `client_id = null`.
3. Nearby vendors (excluding the creator) are notified.
4. Vendors respond in the same way as client requests.

### Notifications
- `notifications` records are inserted on request creation, vendor response, or request closure.
- A realtime listener subscribes to inserts and filters for the current user.
- Notifications trigger:
  - Browser notifications (if permitted).
  - In-app toasts.
  - Notification sounds (Web Audio API).

## Data Model (Supabase)
The database schema is defined in [supabase-setup.sql](supabase-setup.sql).

### Key Tables
- `profiles`: user profile data and role details.
- `requests`: client and vendor requests.
- `request_responses`: vendor responses to requests.
- `notifications`: realtime notification payloads.

### Access Control (RLS)
- Profiles: users can read all profiles; only modify their own.
- Requests: all users can read; clients insert/update their own; vendors can insert vendor-to-vendor requests.
- Request responses: only vendors can insert/update their own responses.
- Notifications: users can read only their own; inserts are allowed for notification creation.

## Environment Variables
Set the following environment variables in your local environment or hosting provider:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_NAME` (optional)
- `VITE_APP_FOOTER_TEXT` (optional, supports `{year}` token)

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Initialize Supabase schema using [supabase-setup.sql](supabase-setup.sql).
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Build and Preview
- Build: `npm run build`
- Preview: `npm run preview`

## Deployment
- The frontend can be deployed to Vercel or Netlify.
- Configure the same environment variables on the hosting provider.
- Ensure Supabase storage policies are applied (from [supabase-setup.sql](supabase-setup.sql)).

## Key Source Files
- Routing and guards: [src/App.tsx](src/App.tsx)
- Auth context: [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx)
- Supabase client: [src/lib/supabase.ts](src/lib/supabase.ts)
- Notifications listener: [src/hooks/useNotificationListener.ts](src/hooks/useNotificationListener.ts)
- Request creation: [src/pages/CreateRequest.tsx](src/pages/CreateRequest.tsx)
- Vendor response flow: [src/pages/VendorDashboard.tsx](src/pages/VendorDashboard.tsx)

## Troubleshooting
- If requests or notifications are missing, verify RLS policies and ensure the SQL script was executed.
- If realtime notifications do not fire, confirm `notifications` is added to `supabase_realtime` publication.
- If map markers are missing, verify vendor profiles include `latitude` and `longitude`.
- If image uploads fail, confirm the `request-images` bucket exists and storage policies are set.

## Security Notes
- All access rules are enforced via Supabase RLS policies.
- Notification reads are limited to the current user.
- Storage access is limited to the request-images bucket with authenticated uploads.

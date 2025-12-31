# Environment Setup Guide

To run the backend, you need to configure your environment variables.
Please create a file named `.env` in the root directory (`d:\Dev 2.0\Client Projects\Social Media Content Mangement`) and populate it with the following keys.

## 1. Authentication (Clerk)
Create a free account at [clerk.com](https://clerk.com). create a new application, and copy the keys from the API Keys section.

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## 2. Database (Supabase)
Create a free project at [supabase.com](https://supabase.com). Go to Project Settings -> Database -> Connection String -> URI.

*   **DATABASE_URL:** Select "Transaction Mode" (Port 6543) and copy the string. Replace `[password]` with your database password.
*   **DIRECT_URL:** Select "Session Mode" (Port 5432) and copy the string.

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

## 3. Storage (Supabase)
Go to Project Settings -> API.

```env
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

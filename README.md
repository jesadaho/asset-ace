# Asset Ace

A professional multi-tenant property management platform. Target users: **Asset Owners**, **Agents**, and **Tenants**. Built for LINE LIFF with a clean, high-end, mobile-optimized UI.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **LINE Integration**: LIFF SDK (@line/liff)
- **Database**: MongoDB (Mongoose)

## Design System

- **Deep Navy** (#0F172A) – Primary backgrounds, headers
- **Mint Green** (#10B981) – Success states, CTAs, highlights

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment Setup

1. Copy `.env.local.example` to `.env.local`:

   ```bash
   cp .env.local.example .env.local
   ```

2. Obtain a LIFF ID from the [LINE Developers Console](https://developers.line.biz/console/):
   - Create a LINE Login channel (or use an existing one)
   - Add a LIFF app
   - Set the endpoint URL to your deployed app URL (HTTPS required)
   - Copy the LIFF ID and add it to `.env.local`:

   ```
   NEXT_PUBLIC_LIFF_ID=your-liff-id
   ```

3. Add your MongoDB connection string (required for onboarding persistence):

   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/asset-ace
   ```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## LINE LIFF Setup

1. **Register a LIFF app** in the LINE Developers Console
2. **Set the endpoint URL** to your deployed HTTPS URL (e.g. `https://yourdomain.com`)
3. **Hide the top bar (Asset Ace + URL)** – In the LIFF app settings, set **Size** to **Full**. That makes the app full-screen without the LINE browser header. (Tall = bar visible, Compact = smaller bar, Full = no bar.)
4. **Deploy** – LIFF requires HTTPS in production
5. **LIFF browser vs external** – In the LINE app, users get LIFF features (profile, share). In an external browser, basic web app behavior applies.

## Property photo upload (S3)

Add Property uses presigned PUT URLs so the browser uploads directly to S3. If you see **"Load failed"** on save, the browser is usually blocking the request due to **CORS**. Configure your S3 bucket CORS to allow:

- **Origin**: your app origin(s), e.g. `https://asset-ace.vercel.app` and `http://localhost:3000`
- **Method**: `PUT`
- **Header**: `Content-Type` (in AllowedHeaders)

Example CORS rule (AWS Console → S3 → bucket → Permissions → CORS):

```json
[
  {
    "AllowedHeaders": ["Content-Type"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": ["https://asset-ace.vercel.app", "http://localhost:3000"],
    "ExposeHeaders": []
  }
]
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── onboarding/     # POST/GET onboarding API
│   ├── layout.tsx          # Root layout + LiffProvider
│   ├── page.tsx            # Landing / role selection
│   ├── onboarding/page.tsx # LIFF onboarding form
│   ├── globals.css         # Design system + Tailwind
│   └── (main)/
│       ├── layout.tsx      # Main layout with BottomNav
│       ├── owners/page.tsx
│       ├── agents/page.tsx
│       └── tenants/page.tsx
├── components/
│   ├── ui/                 # Button, Card, Badge, Input, Select
│   └── layout/             # BottomNav, LiffWrapper, OnboardingGuard
├── lib/
│   ├── api/onboarding.ts   # Client API for onboarding
│   ├── auth/liff.ts        # LIFF token verification
│   └── db/
│       ├── mongodb.ts      # MongoDB connection
│       └── models/user.ts  # User schema
└── providers/
    └── LiffProvider.tsx
```

## License

Private

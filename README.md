# Shelfy - Social Book Tracking App

Shelfy is a full-stack web application designed for book lovers to track their reading progress, discover new books, and connect with others in reading groups.

## ✨ Key Features

- **Personal Library:** Add books to your collection, track your reading status (e.g., Currently Reading, Finished), and view your reading history.
- **Social Groups:** Create or join reading groups with friends. Share progress and discuss books together.
- **Reading Activity:** Visualize your reading habits with charts and stats.
- **User Profiles:** Customize your profile, upload an avatar, and see your reading statistics.
- **Book Discovery:** Search for new books to add to your library.
- **Interactive Discussions:** Leave comments and notes on books you are reading.

## 🆓 Free Beta Mode

- Shelfy is currently running as an unlimited free plan for every user: no quotas, no premium gating, and no user can be marked as “premium” in the database.
- The subscription page is read-only and simply previews the future plans while highlighting that paid features are under construction.
- All Stripe endpoints (checkout, portal, cancel, webhook, plan switching) short-circuit with `501 Not Implemented` while `NEXT_PUBLIC_ENABLE_PREMIUM` is not set to `true`, so there is no billing activity in production.
- Premium-only navigation such as the **Discover** page is hidden for now and replaced with a “Bientôt disponible” notice until paid tiers return.

## 📱 Responsive & Device Support

- Layouts rely on Tailwind breakpoints (`xs` → `2xl`) plus a shared `PageContainer` wrapper to guarantee consistent padding on desktop, tablet, and phone.
- Navigation automatically adapts: `TopNavbar` for desktop/tablet, and a dedicated bottom tab bar (`MobileBottomTabs`) for smartphones with large touch targets.
- Charts, cards, and forms expose mobile fallbacks (lists, vertical stacks, font-size ≥ 16px) to avoid horizontal scrolling on small screens.
- When you add a new page, wrap the content with `PageContainer` and respect the responsive utility classes already defined.

## 🧪 UI Testing (Storybook & Chromatic)

- Storybook is configured for this project. Run `npm run storybook` to preview components locally, and `npm run build-storybook` in CI for static bundles.
- Visual regressions can be captured with Chromatic via `npm run chromatic` (set the `CHROMATIC_PROJECT_TOKEN` environment variable beforehand).
- Add `.stories.tsx` files next to components; Storybook automatically loads them from `src/**`.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Deployment:** [Vercel](https://vercel.com/)

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### 1. Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or later)
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/download/) running locally or on a server.

### 2. Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Shelfy
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### 3. Environment Setup

1.  Create a `.env.local` file in the root of the project by copying the example file:
    ```bash
    cp .env .env.local
    ```

2.  Update the variables in `.env.local` with your local configuration. At a minimum, you will need to set:
    ```env
    # Prisma
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

    # NextAuth
    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="your-super-secret-key"

    # Google Provider (NextAuth)
    GOOGLE_CLIENT_ID="your-google-client-id"
    GOOGLE_CLIENT_SECRET="your-google-client-secret"

    # Google Books API
    GOOGLE_BOOKS_API_KEY="your-google-books-api-key"

    # Resend API for emails
    RESEND_API_KEY="your_resend_api_key"
    ```

### 4. Database Setup

1.  **Apply database migrations:** This will create the necessary tables in your database based on the schema.
    ```bash
    npx prisma migrate dev
    ```

2.  **(Optional) Seed the database:** This will populate the database with initial data.
    ```bash
    npx prisma db seed
    ```

### 5. Run the Development Server

Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

- `src/app/(dashboard)`: Contains all the protected routes and pages for the main user dashboard.
- `src/app/api`: Houses all the API routes for backend functionality.
- `src/components`: Contains reusable React components used throughout the application.
- `src/lib`: Includes utility functions, database helpers (Prisma client), and authentication configuration.
- `prisma`: Holds the database schema (`schema.prisma`), migrations, and seed script.

## 🚢 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

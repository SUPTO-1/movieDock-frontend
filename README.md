MovieDock Frontend is a [Next.js](https://nextjs.org) App Router project organized around a feature-based architecture.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the home page by modifying `src/app/page.tsx`. The page composes feature sections directly from `src/features/landing/components`.

## Structure

- `src/app/` contains routing, layout, and global styles only.
- `src/features/` contains feature-owned components and related modules.
- `src/components/`, `src/hooks/`, `src/lib/`, `src/types/`, `src/utils/`, and `src/constants/` are reserved for shared code when the app needs it.
- Feature code should stay inside its owning feature folder and route files should only compose those pieces.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

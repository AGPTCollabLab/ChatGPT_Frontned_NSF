This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Install the dependencies:

```bash
npm ci
```

Copy `.env.example` to `.env.local` and configure the required services. For
Auth0, create a Regular Web Application and configure these application URIs:

- Allowed Callback URL: `http://localhost:3000/api/auth/callback`
- Allowed Logout URL: `http://localhost:3000`
- Allowed Web Origin: `http://localhost:3000`

Set `AUTH0_ISSUER_BASE_URL` to the Auth0 Domain value (prefixed with `https://`),
and set `AUTH0_CLIENT_ID` and `AUTH0_CLIENT_SECRET` from the same application.
Generate `AUTH0_SECRET` with:

```bash
node -e "console.log(crypto.randomBytes(32).toString('hex'))"
```

Do not commit `.env.local`; it contains credentials and is ignored by Git.

Then run the development server:

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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.


## Updates
0ct 14: added chat title + section headers within response -- dependent on GPT's response following hierarchy, so may need to include a more dyanmic way if they are not adherent to the heading request. Added flexible search (can also bring it up via ctrl+k)
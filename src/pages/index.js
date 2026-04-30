import Head from 'next/head';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { getSession } from '@auth0/nextjs-auth0';

export default function Home() {
  const { isLoading, error, user } = useUser();

  if (isLoading) {
    return (
      <main
        role="status"
        aria-live="polite"
        className="flex justify-center items-center min-h-screen w-full bg-gray-800 text-white text-center"
      >
        Loading.
      </main>
    );
  }

  if (error) {
    return (
      <main
        role="alert"
        aria-live="assertive"
        className="flex justify-center items-center min-h-screen w-full bg-gray-800 text-white text-center p-6"
      >
        <p>An error occurred: {error.message}</p>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Accessible ChatGPT Interface</title>
      </Head>
      <main
        className="flex justify-center items-center min-h-screen w-full bg-gray-800 text-white text-center"
        aria-labelledby="home-title"
      >
        <div className="max-w-xl px-6">
          <h1 id="home-title" className="text-2xl font-bold mb-4">
            Accessible ChatGPT Interface
          </h1>
          <p className="mb-6">
            A ChatGPT interface designed for screen reader users. Sign in to
            start a conversation.
          </p>
          {!user ? (
            <Link
              href="/api/auth/login"
              className="btn"
              aria-label="Sign in to ChatGPT Interface"
            >
              Login
            </Link>
          ) : (
            <Link
              href="/api/auth/logout"
              className="btn"
              aria-label="Log out of ChatGPT Interface"
            >
              Logout
            </Link>
          )}
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context.req, context.res);
  if (session) {
    return {
      redirect: {
        destination: '/chat',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

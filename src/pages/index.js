import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { getSession } from '@auth0/nextjs-auth0';
import { announce } from '@/lib/announcer';

const LANDING_DESCRIPTION =
  'Accessible ChatGPT Interface. A ChatGPT interface designed for screen reader users. Press Enter on the Login button to sign in and start a conversation.';

export default function Home() {
  const { isLoading, error, user } = useUser();
  const loginRef = useRef(null);

  // Auto-focus the Login link on mount and announce the page description
  // through the persistent assertive live region so screen readers don't
  // require the user to Tab around looking for it.
  useEffect(() => {
    if (isLoading || error || user) return;
    const focusTimer = setTimeout(() => {
      if (loginRef.current) {
        loginRef.current.focus();
      }
    }, 60);
    const announceTimer = setTimeout(() => {
      announce(LANDING_DESCRIPTION, 'assertive');
    }, 300);
    return () => {
      clearTimeout(focusTimer);
      clearTimeout(announceTimer);
    };
  }, [isLoading, error, user]);

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
      <main className="flex justify-center items-center min-h-screen w-full bg-gray-800 text-white text-center">
        <div className="max-w-xl px-6">
          <h1 className="text-2xl font-bold mb-4">
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
              ref={loginRef}
            >
              Login
            </Link>
          ) : (
            <Link href="/api/auth/logout" className="btn">
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

"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight } from "lucide-react";

function errorMessage(code) {
  if (!code) return null;
  if (code === "OAuthAccountNotLinked") {
    return "That email is already linked to a different sign-in method.";
  }
  if (code === "AccessDenied") {
    return "Sign-in was cancelled or access was denied.";
  }
  return "Something went wrong signing you in. Please try again.";
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState(() =>
    errorMessage(searchParams.get("error")),
  );
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    try {
      await signIn("google", { redirectTo: "/chat" });
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-center">
          Welcome to Zev
        </h1>
        <p className="mt-2 text-sm text-center text-zinc-600 dark:text-zinc-400">
          Sign in with Google to start chatting
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className="h-10 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Redirecting..." : "Continue with Google"}
          </button>
        </div>

        <div className="mt-6 flex justify-end text-sm">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Skip <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

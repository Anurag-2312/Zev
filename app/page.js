import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Zev</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          A simple AI chatbot. Sign in to save your chats, or jump in as a
          guest.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/login"
            className="h-11 inline-flex items-center justify-center rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="h-11 inline-flex items-center justify-center rounded-lg border border-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Sign up
          </Link>
          <Link
            href="/chat"
            className="h-11 inline-flex items-center justify-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Continue as guest
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

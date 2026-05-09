"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, LogOut, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Sidebar({
  open,
  onClose,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  useEffect(() => {
    if (!confirmingDelete) return;
    function onKey(e) {
      if (e.key === "Escape") setConfirmingDelete(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmingDelete]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  function handleDelete(conv) {
    setConfirmingDelete(conv);
  }

  function confirmDelete() {
    if (confirmingDelete) {
      onDeleteConversation?.(confirmingDelete.id);
    }
    setConfirmingDelete(null);
  }

  async function handleLogout() {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) return;
      router.push("/");
      router.refresh();
    } catch {
      // network error — user stays signed in and can retry
    }
  }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 shrink-0 border-r border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950 transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-100 dark:border-zinc-900">
            <span className="font-semibold">Zev</span>
            <button
              onClick={onNewChat}
              className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-2">
            {!user ? (
              <div className="px-3 py-2 text-sm text-zinc-500">
                Log in to save your chats.
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500">
                No conversations yet. Send a message to start.
              </div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center rounded-md ${
                    c.id === activeConversationId
                      ? "bg-zinc-100 dark:bg-zinc-900"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <button
                    onClick={() => onSelectConversation?.(c.id)}
                    className={`flex-1 min-w-0 text-left px-3 py-2 text-sm truncate ${
                      c.id === activeConversationId
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {c.title || "New chat"}
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    aria-label="Delete conversation"
                    title="Delete conversation"
                    className="opacity-40 group-hover:opacity-100 transition-opacity mr-1 h-7 w-7 inline-flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </nav>

          <div className="p-3 border-t border-zinc-100 dark:border-zinc-900">
            {user ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs text-zinc-500">Signed in as</div>
                  <div className="text-sm truncate">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="text-xs text-zinc-500">Guest mode</div>
                <div className="flex gap-2 text-sm">
                  <Link
                    href="/login"
                    className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                  >
                    Log in
                  </Link>
                  <span className="text-zinc-400">·</span>
                  <Link
                    href="/signup"
                    className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {confirmingDelete && (
        <div
          onClick={() => setConfirmingDelete(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
          >
            <h2
              id="delete-confirm-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Delete chat?
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              This will delete{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {confirmingDelete.title || "New chat"}
              </span>{" "}
              and all of its messages. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmingDelete(null)}
                className="h-9 px-4 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                autoFocus
                className="h-9 px-4 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

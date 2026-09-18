import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-16">
      <Link
        href="/"
        className="mb-6 font-mono text-xs text-ink-faint hover:text-ink dark:text-paper/40 dark:hover:text-paper"
      >
        ← Home
      </Link>
      <SignUp />
    </main>
  );
}

// Signup page (design.md S-SIGNUP-W).
import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
      <h1 className="text-2xl font-semibold text-text">Create account</h1>
      <p className="mt-2 max-w-[70ch] leading-6 text-muted">
        Start logging today&apos;s eggs and feed in under a minute.
      </p>

      <SignupForm />

      <p className="mt-6 text-sm leading-6 text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent">
          Back to login
        </Link>
      </p>
    </div>
  );
}

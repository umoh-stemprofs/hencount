// Signup page, built to stitch_.../hencount_make_an_account_desktop.
import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";
import { card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <div className={`w-full max-w-md ${card} sm:p-8`}>
      <div className="flex flex-col gap-1">
        <h1 className="text-headline-md tracking-tight text-text">
          Make an account
        </h1>
        <p className="text-body-lg leading-7 text-muted">
          Start logging today&apos;s eggs and feed in under a minute.
        </p>
      </div>

      <SignupForm />

      <p className="mt-space-lg text-center text-body-base leading-6 text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Back to login
        </Link>
      </p>
    </div>
  );
}

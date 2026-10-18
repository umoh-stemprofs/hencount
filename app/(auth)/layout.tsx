// Minimal centered layout for login and signup (design.md S-LOGIN-W).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10">
      {children}
      <p className="mt-8 text-center text-sm leading-6 text-muted">
        Decision-support tool. You decide.
      </p>
    </main>
  );
}

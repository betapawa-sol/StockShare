import { loginAction } from "@/app/actions/auth";
import { AuthForm, AuthLink } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-center text-lg font-semibold text-neutral-100">
        Log in to your account
      </h1>
      <AuthForm
        action={loginAction}
        submitLabel="Log in"
        pendingLabel="Logging in…"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
        footer={
          <p className="mt-2 text-center text-sm text-neutral-400">
            New to StockShare? <AuthLink href="/register" label="Create an account" />
          </p>
        }
      />
    </>
  );
}

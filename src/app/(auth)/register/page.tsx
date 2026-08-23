import { registerAction } from "@/app/actions/auth";
import { AuthForm, AuthLink } from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-6 text-center text-lg font-semibold text-neutral-100">
        Create your free account
      </h1>
      <AuthForm
        action={registerAction}
        submitLabel="Sign up"
        pendingLabel="Creating account…"
        fields={[
          { name: "name", label: "Full name", type: "text", autoComplete: "name" },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
        ]}
        footer={
          <p className="mt-2 text-center text-sm text-neutral-400">
            Already have an account? <AuthLink href="/login" label="Log in" />
          </p>
        }
      />
    </>
  );
}

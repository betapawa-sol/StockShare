"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthFormState } from "@/app/actions/auth";

type Field = {
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
};

export function AuthForm({
  action,
  fields,
  submitLabel,
  pendingLabel,
  footer,
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  fields: Field[];
  submitLabel: string;
  pendingLabel: string;
  footer: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-1">
          <label htmlFor={field.name} className="text-sm font-medium text-neutral-300">
            {field.label}
          </label>
          <input
            id={field.name}
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            required
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
          />
          {state?.errors?.[field.name]?.map((error) => (
            <p key={error} className="text-sm text-red-400">
              {error}
            </p>
          ))}
        </div>
      ))}

      {state?.message && <p className="text-sm text-red-400">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-neutral-950 transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {pending ? pendingLabel : submitLabel}
      </button>

      {footer}
    </form>
  );
}

export function AuthLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-emerald-400 hover:underline">
      {label}
    </Link>
  );
}

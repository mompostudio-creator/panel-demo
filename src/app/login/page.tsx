"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-plane">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold tracking-tight">MompoStudio OS</p>
          <p className="text-xs text-ink-muted mt-1">Panel de control</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="text-lg font-semibold text-center mb-1">Bienvenido de nuevo</h1>
          <p className="text-sm text-ink-secondary text-center mb-7">Accede para ver los datos de tu empresa</p>

          <form action={action} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-secondary block mb-1.5">Usuario</label>
              <input
                name="username"
                required
                autoComplete="username"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-secondary block mb-1.5">Contraseña</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              />
            </div>

            {state?.error && <p className="text-sm text-center text-critical">{state.error}</p>}

            <button
              disabled={pending}
              type="submit"
              className="w-full mt-2 px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-150 disabled:opacity-60"
            >
              {pending ? "Accediendo..." : "Acceder"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData) {
  const username = formData.get("username");
  const password = formData.get("password");

  if (username !== process.env.DEMO_USER || password !== process.env.DEMO_PASSWORD) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await createSession();
  redirect("/inicio");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

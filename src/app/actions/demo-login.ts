"use server";

import { signIn } from "../../../auth";

export async function loginAsDemo() {
  await signIn("demo", {
    redirectTo: "/dashboard",
  });
}

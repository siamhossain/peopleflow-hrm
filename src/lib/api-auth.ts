import { auth } from "../../auth";

export async function getApiUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}

export function unauthorizedResponse() {
  return Response.json(
    { message: "Authentication required." },
    { status: 401 },
  );
}

export function forbiddenResponse() {
  return Response.json(
    { message: "You are not authorized to perform this action." },
    { status: 403 },
  );
}

/**
 * Blocks DEMO_VIEWER users from modifying application data.
 *
 * Use this at the beginning of every POST, PUT, PATCH, and DELETE handler.
 */
export function demoReadOnlyResponse(user: { role: string } | null) {
  if (user?.role === "DEMO_VIEWER") {
    return Response.json(
      { message: "Demo access is read-only. Changes are not allowed." },
      { status: 403 },
    );
  }

  return null;
}

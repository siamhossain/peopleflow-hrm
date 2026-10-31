
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

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";

        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            employee: true,
          },
        });

        if (!user) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          password,
          user.passwordHash,
        );

        if (!passwordMatches) {
          return null;
        }

        if (user.role === "EMPLOYEE" && !user.employeeId) {
          return null;
        }

        const name = user.employee
          ? `${user.employee.firstName} ${user.employee.lastName}`
          : user.role === "ADMIN"
            ? "HR Administrator"
            : user.email;

        return {
          id: user.id,
          email: user.email,
          name,
          role: user.role,
          employeeId: user.employeeId,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.employeeId = user.employeeId;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const userId =
          typeof token.userId === "string"
            ? token.userId
            : typeof token.sub === "string"
              ? token.sub
              : null;

        const role =
          token.role === "ADMIN" || token.role === "EMPLOYEE"
            ? token.role
            : null;

        const employeeId =
          typeof token.employeeId === "string" || token.employeeId === null
            ? token.employeeId
            : null;

        if (userId) {
          session.user.id = userId;
        }

        if (role) {
          session.user.role = role;
        }

        session.user.employeeId = employeeId;
      }

      return session;
    },
  },
});

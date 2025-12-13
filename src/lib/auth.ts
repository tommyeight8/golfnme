import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authService } from "@/services";
import { userRepository } from "@/repositories";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),

    // Email/Password
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials);

        if (!validated.success) {
          return null;
        }

        const { email, password } = validated.data;

        const result = await authService.validateCredentials({
          email,
          password,
        });

        if (!result.success || !result.user) {
          return null;
        }

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          image: result.user.avatarUrl,
          username: result.user.username,
          handicap: result.user.handicap,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google OAuth - create or update user
      if (account?.provider === "google") {
        try {
          const email = user.email;
          if (!email) return false;

          const result = await authService.findOrCreateOAuthUser({
            email,
            name: user.name ?? "Golfer",
            image: user.image ?? undefined,
          });

          if (!result.success || !result.user) {
            return false;
          }

          // Attach the database user info
          user.id = result.user.id;
          (user as any).username = result.user.username;
          (user as any).handicap = result.user.handicap;

          return true;
        } catch (error) {
          console.error("Error during Google sign in:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      // Initial sign-in - fetch fresh data from DB
      if (account && user) {
        if (account.provider === "google" && user.email) {
          const dbUser = await userRepository.findByEmail(user.email);

          if (dbUser) {
            token.id = dbUser.id;
            token.username = dbUser.username ?? "";
            token.handicap = dbUser.handicap ?? null;
            token.picture = dbUser.avatarUrl ?? null;
            token.name = dbUser.name;
            token.email = dbUser.email;
            return token;
          }
        }

        // Credentials provider
        token.id = user.id ?? "";
        token.username = (user as any).username ?? "";
        token.handicap = (user as any).handicap ?? null;
        token.picture = user.image ?? null;
      }

      if (trigger === "update" && session) {
        token.name = session.name;
        token.username = session.username ?? token.username;
        token.handicap = session.handicap ?? token.handicap;
        if (session.image) token.picture = session.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? (token.sub as string) ?? "";
        session.user.username = (token.username as string) ?? "";
        session.user.handicap = (token.handicap as number) ?? null;
        session.user.image = (token.picture as string) ?? null; // Add this
      }
      return session;
    },
  },
});

// Re-export hash functions for use elsewhere
export async function hashPassword(password: string): Promise<string> {
  return authService.hashPassword(password);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return authService.verifyPassword(password, hash);
}

// Server-side auth helpers
export async function getServerSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session;
}

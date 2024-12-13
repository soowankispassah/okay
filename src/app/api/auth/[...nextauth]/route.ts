import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: true,
        };
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        isAfterSignup: { label: "Is After Signup", type: "text" },
        isAfterReset: { label: "Is After Reset", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email) {
            throw new Error("Please check your credentials and try again");
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user || !user.password) {
            throw new Error("Please check your credentials and try again");
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isCorrectPassword) {
            throw new Error("Please check your credentials and try again");
          }

          if (credentials.isAfterReset === "true") {
            return user;
          }

          if (credentials.isAfterSignup === "true") {
            if (!user?.emailVerified) {
              throw new Error("Please verify your email before signing in");
            }
            return user;
          }

          if (!user.emailVerified) {
            throw new Error("Please verify your email before signing in");
          }

          return user;
        } catch (error: any) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          try {
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                emailVerified: true,
              },
            });
          } catch (error) {
            console.error("Error creating user:", error);
            return false;
          }
        } else if (!existingUser.emailVerified) {
          try {
            await prisma.user.update({
              where: { email: user.email! },
              data: { emailVerified: true },
            });
          } catch (error) {
            console.error("Error updating user:", error);
            return false;
          }
        }

        return true;
      }

      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.emailVerified = true;
        if (account) {
          token.provider = account.provider;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.emailVerified = true;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 
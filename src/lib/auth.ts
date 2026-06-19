import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/db';
import { operators, emailVerifications, phoneVerifications } from '@/db/schema';
import { and, eq, gt } from 'drizzle-orm';
import { hashOtp } from '@/lib/otp';

const adminEmails = (process.env.ADMIN_EMAILS || 'nadeemkolu22@gmail.com').split(',').map(e => e.trim());

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    Credentials({
      id: 'email-otp',
      name: 'Email OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email) return null;

          const email = credentials.email as string;
          const otp = credentials.otp as string;

          const hashedOtp = await hashOtp(otp);
          const verified = await db.query.emailVerifications.findFirst({
            where: and(
              eq(emailVerifications.email, email),
              eq(emailVerifications.otp, hashedOtp),
              eq(emailVerifications.verified, true),
              gt(emailVerifications.expires_at, new Date()),
            ),
            orderBy: (ev, { desc }) => [desc(ev.created_at)],
          });

          if (!verified) {
            console.error(`[auth] email-otp: no verified record found for ${email}`);
            return null;
          }

          let stored = await db.query.operators.findFirst({
            where: eq(operators.email, email),
          });

          if (!stored) {
            stored = await db.query.operators.findFirst({
              where: eq(operators.whatsapp, email),
            });
          }

          if (!stored) {
            console.error(`[auth] email-otp: no operator found for ${email}`);
            return null;
          }

          return {
            id: stored.id,
            name: stored.name,
            email,
            phone: stored.whatsapp,
          };
        } catch (err) {
          console.error('[auth] email-otp: authorize threw:', err);
          return null;
        }
      },
    }),
    Credentials({
      id: 'whatsapp-otp',
      name: 'WhatsApp OTP',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.phone) return null;

          const phone = credentials.phone as string;
          const otp = credentials.otp as string;

          const hashedOtp = await hashOtp(otp);
          const verified = await db.query.phoneVerifications.findFirst({
            where: and(
              eq(phoneVerifications.phone, phone),
              eq(phoneVerifications.otp, hashedOtp),
              eq(phoneVerifications.verified, true),
              gt(phoneVerifications.expires_at, new Date()),
            ),
            orderBy: (pv, { desc }) => [desc(pv.created_at)],
          });
          if (!verified) {
            console.error(`[auth] whatsapp-otp: no verified record for ${phone}`);
            return null;
          }

          let stored = await db.query.operators.findFirst({
            where: eq(operators.whatsapp, phone),
          });

          if (!stored) {
            console.error(`[auth] whatsapp-otp: no operator found for ${phone}`);
            return null;
          }

          return {
            id: stored.id,
            name: stored.name,
            email: stored.email || '',
            phone: stored.whatsapp,
          };
        } catch (err) {
          console.error('[auth] whatsapp-otp: authorize threw:', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        return true;
      }
      return true;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      const sUser = session.user as unknown as Record<string, unknown>;
      sUser.is_admin = token.is_admin;
      sUser.operator_id = token.operator_id;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        if (user.email && adminEmails.includes(user.email)) {
          token.is_admin = true;
        }
        if (!token.is_admin && user.email) {
          const op = await db.query.operators.findFirst({
            where: eq(operators.email, user.email),
            columns: { id: true },
          });
          if (op) {
            token.operator_id = op.id;
          }
        }
        if (!token.is_admin && !token.operator_id && user.id) {
          const op = await db.query.operators.findFirst({
            where: eq(operators.id, user.id),
            columns: { id: true },
          });
          if (op) {
            token.operator_id = op.id;
          }
        }
        if (!user.id) return token;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
});

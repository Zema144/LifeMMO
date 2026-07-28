import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import GoogleProvider from "next-auth/providers/google"
import DiscordProvider from "next-auth/providers/discord"
import CredentialsProvider from "next-auth/providers/credentials"
import crypto from "crypto"

// Валідатор даних від Telegram Mini App
function verifyTelegramWebAppData(telegramInitData: string) {
  const initData = new URLSearchParams(telegramInitData)
  const hash = initData.get("hash")
  
  if (!hash) return null

  initData.delete("hash")
  
  // Сортуємо параметри за алфавітом
  const dataToCheck = Array.from(initData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")

  // Створюємо секретний ключ на основі токена твого бота
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(process.env.TELEGRAM_BOT_TOKEN || "")
    .digest()
    
  // Хешуємо дані і порівнюємо з отриманим хешем
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataToCheck)
    .digest("hex")

  if (calculatedHash === hash) {
    const userString = initData.get("user")
    return userString ? JSON.parse(userString) : null
  }
  
  return null
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt", // Використовуємо JWT, бо в нас є CredentialsProvider (Telegram)
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    
    // Кастомний провайдер для Telegram Mini App
    CredentialsProvider({
      id: "telegram-login",
      name: "Telegram",
      credentials: {
        initData: { label: "Init Data", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.initData) throw new Error("Не передано дані Telegram")

        const tgUser = verifyTelegramWebAppData(credentials.initData)
        if (!tgUser) throw new Error("Недійсний підпис Telegram")

        // Шукаємо або створюємо користувача в базі
        const user = await prisma.user.upsert({
          where: { telegramId: tgUser.id.toString() },
          update: {
            username: tgUser.username,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            avatarUrl: tgUser.photo_url,
          },
          create: {
            telegramId: tgUser.id.toString(),
            username: tgUser.username,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            avatarUrl: tgUser.photo_url,
          },
        })

        return user
      },
    }),
  ],
  callbacks: {
    // Розширюємо токен та сесію, щоб мати доступ до id та статусу онбордингу на клієнті
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isOnboardingDone = (user as any).isOnboardingDone
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isOnboardingDone = token.isOnboardingDone as boolean
      }
      return session
    },
  },
}
import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login", // Куди кидати незалогінених юзерів
  },
})

// Вказуємо, які саме шляхи треба захищати. 
// Захищаємо все, ОКРІМ сторінки логіну, API-роутів та статики (картинок/шрифтів).
export const config = {
matcher: ["/((?!api/auth|api|_next/static|_next/image|favicon.ico|login|ingest|avatar-wizard.png).*)"],
}
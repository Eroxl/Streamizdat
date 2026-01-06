import { createAuthClient } from "better-auth/client"
import { usernameClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4000',
    basePath: '/auth',
    plugins: [
        usernameClient(),
    ] 
})
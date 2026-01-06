import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "./db/db";
import { username } from "better-auth/plugins";
import { account, session, user, verification } from "./db/schemas/auth-schema";

const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: user,
            account: account,
            session: session,
            verification: verification,
        }
    }),
    emailAndPassword: { 
        enabled: true, 
    }, 
    baseURL: process.env.BASE_URL as string,
    socialProviders: {
        github: { 
            clientId: process.env.GITHUB_CLIENT_ID as string, 
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string, 
        }, 
        google: { 
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
        }, 
        tiktok: { 
            clientSecret: process.env.TIKTOK_CLIENT_SECRET as string, 
            clientKey: process.env.TIKTOK_CLIENT_KEY as string, 
        }, 
        twitch: { 
            clientId: process.env.TWITCH_CLIENT_ID as string, 
            clientSecret: process.env.TWITCH_CLIENT_SECRET as string, 
        }, 
    },
    plugins: [ username() ],
    basePath: '/auth',
    trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"],
});

export { auth };
export default auth;

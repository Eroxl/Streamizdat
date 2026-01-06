import { Request, Response, NextFunction } from "express";

import auth from "../auth";
import db from "../db/db";
import { adminUsers } from "../db/schemas/settings-schema";
import { eq } from "drizzle-orm";

const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers as any,
        });

        if (!session || !session.user) {
            res.status(401).json({ error: "Unauthorized: No valid session" });
            return;
        }

        const userId = session.user.id;

        const adminUser = await db
            .select()
            .from(adminUsers)
            .where(eq(adminUsers.userId, userId))
            .limit(1);

        if (adminUser.length === 0) {
            res.status(403).json({ error: "Forbidden: User is not an admin" });
            return;
        }

        (req as any).user = session.user;
        (req as any).adminUser = adminUser[0];

        next();
    } catch (error) {
        console.error("Admin check error:", error);
        res.status(500).json({ error: "Internal server error during authorization" });
    }
}

export default requireAdmin;

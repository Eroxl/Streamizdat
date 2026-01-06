import { Request, Response, NextFunction } from "express";

import auth from "../auth";

const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers as any,
        });

        if (!session || !session.user) {
            res.status(401).json({ error: "Unauthorized: No valid session" });
            return;
        }

        (req as any).user = session.user;
        (req as any).session = session.session;

        next();
    } catch (error) {
        console.error("Auth check error:", error);
        res.status(500).json({ error: "Internal server error during authentication" });
    }
}

export default requireAuth;
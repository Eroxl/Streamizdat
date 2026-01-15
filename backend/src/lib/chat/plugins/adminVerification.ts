import { eq } from "drizzle-orm";

import db from "../../../db/db";
import { adminUsers } from "../../../db/schemas/settings-schema";
import { ChatPlugin, ConnectMiddlewareFn } from "../chatApp";

const adminVerificationMiddleware: ConnectMiddlewareFn = async (_, client, next) => {
    if (!client.user || !("id" in client.user)) return next();

    const clientRoles = (client.state["roles"] || []) as string[];

    const adminRecord = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.userId, client.user.id))
        .limit(1)
        .then((res) => res[0]);

    if (!adminRecord) {   
        client.state["isAdmin"] = false;
        return next();
    }

    client.state["isAdmin"] = true;
    
    clientRoles.push(adminRecord.permissions.includes("super_user") ? "super_user" : "admin");
    client.state["roles"] = clientRoles;
    console.log(`User ${client.user.name} verified as admin.`);

    next();
};

const adminVerificationPlugin: ChatPlugin = {
    middleware: {
        connect: [adminVerificationMiddleware],
    },
};

export default adminVerificationPlugin;

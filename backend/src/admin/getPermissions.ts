import express from 'express';

const router = express.Router();

router.get('/permissions', async (req, res) => {
    const adminUser = (req as any).adminUser;

    if (!adminUser) {
        return res.status(403).json({ error: 'Forbidden: User is not an admin' });
    }

    return res.json({ success: true, permissions: adminUser.permissions });
});

export default router;
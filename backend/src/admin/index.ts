import express from 'express';

import hasPermissions from '../middleware/hasPermissions';

import getStreamSettingsRouter from './getStreamSettings';
import updateStreamSettingsRouter from './updateStreamSettings';
import updatePersonalEmbedRouter from './updatePersonalEmbed';
import getPermissionsRouter from './getPermissions';
import communityEmbedRouter from './communityEmbed';


const router = express.Router();

const ROUTER_PATH = '/admin/';

router.use(ROUTER_PATH, hasPermissions(['manage_stream_settings']), getStreamSettingsRouter);
router.use(ROUTER_PATH, hasPermissions(['manage_stream_settings']), updateStreamSettingsRouter);

router.use(ROUTER_PATH, hasPermissions(['manage_stream_settings']), updatePersonalEmbedRouter);

router.use(ROUTER_PATH, hasPermissions(['manage_stream_settings']), communityEmbedRouter);

router.use(ROUTER_PATH, getPermissionsRouter);

export default router;
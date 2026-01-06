import express from 'express';

import hasPermissions from '../../middleware/hasPermissions';

import create from './createCommunityEmbed';
import update from './editCommunityEmbed';
import deleteEmbed from './deleteCommunityEmbed';


const router = express.Router();

router.use('/', hasPermissions(['manage_stream_settings']), create);
router.use('/', hasPermissions(['manage_stream_settings']), update);
router.use('/', hasPermissions(['manage_stream_settings']), deleteEmbed);

export default router;
'use strict';

const express = require('express');
const router = express.Router();

const gameController = require('../controllers/storyGame');
const { createRateLimiter } = require('../helpers/security');

const promptLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 30, key: req => `prompt:${req.ip}` });

router.get('/getWritingPrompt', promptLimiter, gameController.getWritingPrompt);

module.exports = router;

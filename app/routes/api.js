'use strict';

const express = require('express');
const router = express.Router();

const gameController = require('../controllers/storyGame');

router.get('/getWritingPrompt', gameController.getWritingPrompt);

module.exports = router;

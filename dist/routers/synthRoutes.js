"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SynthController_1 = require("../controllers/SynthController");
const router = (0, express_1.Router)();
router.get('/wave', SynthController_1.getWave);
exports.default = router;

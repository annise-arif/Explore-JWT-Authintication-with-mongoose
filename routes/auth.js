const express = require("express");
const authController = require("../controllers/auth");
const rateLimiter = require("../helpers/rateLimiter");

// Router initialisation
const router = express.Router();

// Routes
router.get("/test", rateLimiter(1, 10), authController.test);

module.exports = router;

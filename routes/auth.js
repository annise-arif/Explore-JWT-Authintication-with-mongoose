const express = require("express");
const authController = require("../controllers/auth");

// API Middleware
const rateLimiter = require("../helpers/rateLimiter");
const verifyToken = require("../helpers/verifyToken");

// Router initialisation
const router = express.Router();

// Routes
router.get("/test", [rateLimiter(1, 10), verifyToken], authController.test);

// [POST] Login
router.post("/login", authController.login);

// [POST] Register
router.post("/register", authController.register);

// [POST] Token
router.post("/token", authController.token);

// [POST] Confirm Email Token
router.post(
  "/confirmEmailToken",
  verifyToken,
  authController.confirmEmailToken
);

module.exports = router;

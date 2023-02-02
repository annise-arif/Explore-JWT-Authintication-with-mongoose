const User = require("../models/User");
const jwt = require("jsonwebtoken");
const validation = require("../helpers/validation");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const register = async (req, res) => {
  try {
    const { error } = validation.registerSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        status: 400,
        message: "INPUT_ERRORS",
        errors: error.details,
        original: error._original,
      });
    } else {
      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      // Create new User instance
      const user = new User({
        email: req.body.email,
        password: hashedPassword,
        emailConfirmed: false,
        emailToken: uuidv4(),
        security: {
          tokens: [],
          passwordReset: {
            token: null,
            provisionalPassword: null,
            expiry: null,
          },
        },
      });

      // Attempt to save the user in database
      await user.save();

      // Generate Access & Refresh Token
      const accessToken = jwt.sign(
        {
          _id: user.id,
          email: user.email,
        },
        process.env.SECRET_ACCESS_TOKEN,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
      );
      const refreshToken = jwt.sign(
        {
          _id: user.id,
          email: user.email,
        },
        process.env.SECRET_REFRESH_TOKEN,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
      );

      // Assign the token to user and save
      await User.updateOne(
        { email: user.email },
        {
          $push: {
            "security.tokens": {
              refreshToken: refreshToken,
              createdAt: new Date(),
            },
          },
        }
      );

      res
        .status(200)
        .header()
        .json({
          success: {
            status: 200,
            message: "REGISTER_SUCCESS",
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: {
              id: user.id,
              email: user.email,
            },
          },
        });
    }
  } catch (err) {
    console.log(err);
    let errorMessage;

    if (err.keyPattern.email === 1) {
      errorMessage = "EMAIL_EXISTS";
    } else {
      errorMessage = err;
    }

    res.status(400).json({ error: { status: 400, message: errorMessage } });
  }
};

const token = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;

    // Verify if the token is valid - if not, don't authorise, ask to re-authenticate
    try {
      const decodeRefreshToken = jwt.verify(
        refreshToken,
        process.env.SECRET_REFRESH_TOKEN
      );
      const user = await User.findOne({ email: decodeRefreshToken.email });
      const existingRefreshTokens = user.security.tokens;

      // Check if refresh token is in document
      if (
        existingRefreshTokens.some(
          (token) => token.refreshToken === refreshToken
        )
      ) {
        // Generate new Access Token
        const accessToken = jwt.sign(
          {
            _id: user.id,
            email: user.email,
          },
          process.env.SECRET_ACCESS_TOKEN,
          { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
        );

        // Send new Access Token
        res.status(200).json({
          success: {
            status: 200,
            message: "ACCESS_TOKEN_GENERATED",
            accessToken: accessToken,
          },
        });
      } else {
        res
          .status(401)
          .json({ error: { status: 401, message: "INVALID_REFRESH_TOKEN" } });
      }
    } catch (err) {
      res
        .status(401)
        .json({ error: { status: 401, message: "INVALID_REFRESH_TOKEN" } });
    }
  } catch (err) {
    res.status(400).json({ error: { status: 400, message: "BAD_REQUEST" } });
  }
};

const test = async (req, res) => {
  try {
    const newUser = new User({
      email: "test2@test.com",
      password: "test",
      emailConfirmed: false,
      emailToken: "test",
      security: {
        tokens: null,
        passwordReset: null,
      },
    });

    await newUser.save();
    res.send(newUser);
  } catch (err) {
    res.send(err);
  }
};

module.exports = { test, register, token };

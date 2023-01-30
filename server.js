const express = require("express");
const app = express();
const mongoose = require("mongoose");
const port = process.env.PORT;
const User = require("./models/User");

app.get("/test", async (req, res) => {
  try {
    const newUser = new User({
      email: "test@test.com",
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
});

mongoose
  .connect(
    `${process.env.DB_PROTOCOL}://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}?${process.env.DB_PARAMS}`
  )
  .then(() => {
    app.listen(port, () => {
      console.log(`Example app listening to http://localhost: ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
process.on("SIGINT", () => {
  mongoose.connection.close(() => {
    console.log("Mongoose disconnectd on app termination");
    process.exit(0);
  });
});

const express = require("express");
const app = express();
const port = process.env.PORT;
const mongoose = require("mongoose");

app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");

// Declare API category endpoints
app.use("/api/auth", authRoutes);

mongoose
  .connect(
    `${process.env.DB_PROTOCOL}://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}?${process.env.DB_PARAMS}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    }
  )
  .then(() => {
    app.listen(port, () => {
      console.log("API Listening to http://localhost:" + port);
    });
  })
  .catch((err) => {
    console.log(err);
  });

process.on("SIGINT", () => {
  mongoose.connection.close(() => {
    console.log("Mongoose disconnected on app termination");
    process.exit(0);
  });
});

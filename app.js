  const express = require('express');
  const app = express();
  require('dotenv').config();
  const { connectToMongo } = require ('./db');
  const morgan = require("morgan");
  const winston = require("winston");
  const fs = require("fs");

  const passport = require('passport');
  const authenticateRoute = require('./Route/authentication');
  const MongoStore = require ('connect-mongo');
  const session = require ('express-session');
  const User = require ('./models/user');
  const isAuthenticated = require('./middleware/isAuthenticated');
  const cors = require('cors');
  const cookieParser = require("cookie-parser");

  const productRoute = require('./Route/product');
  const brandRoute = require('./Route/brand');
  const categoryRoute = require('./Route/category');
  const transactionRoute = require('./Route/transaction');


  // Create a write stream (in append mode)
  const logStream = fs.createWriteStream('./access.log', { flags: 'a' });

  // Create a winston logger for production
  const logger = winston.createLogger({
    level: 'info',
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'combined.log' }),
    ],
  });

  if (process.env.NODE_ENV === 'production') {
    // Log HTTP requests to file using morgan and winston in production
    app.use(morgan('combined', { stream: logStream }));
    // You can also log errors or other important messages
    logger.info('Production logging is enabled');
  } else {
    app.use(morgan('dev'));
  }


  app.use(express.json());
  app.use(
    cors({
      origin: ["http://localhost:3000"], // Make sure this matches your frontend
      credentials: true, // ✅ Allow sending cookies
    })
  );

  app.set("trust proxy", 1); // Important for session cookies in production

  app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "http://localhost:3000");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      next();
  });

  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // Set to true if using HTTPS
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        // Ensures cookies are sent over HTTPS in production
        maxAge: 24 * 60 * 60 * 1000, // 1 day (adjust as needed)
      }, // secure: false for local dev
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
        collectionName: "sessions",
      }),
    })
  );


  app.use(passport.initialize());
  app.use(passport.session());

  connectToMongo();

  passport.use(User.createStrategy());
  passport.serializeUser((user, done) => {
      // console.log("✅ Serializing User:", user._id); // Debugging
      done(null, user._id);
  });
  passport.deserializeUser(async (id, done) => {
      try {
          // console.log("🔄 Deserializing User ID:", id);
          const user = await User.findById(id);
          if (!user) {
              return done(null, false);
          }
          // console.log("✅ User found:", user);
          done(null, user);
      } catch (error) {

          done(error, null);
      }
  });

  app.use("/api/auth", authenticateRoute);
  app.use("/api/product", productRoute); // isAuthenticated protects route
  app.use("/api/brand", brandRoute);
  app.use("/api/category", categoryRoute);
  app.use("/api/transact", isAuthenticated, transactionRoute);

  app.get("/", (req, res) => {
      res.status(200).send("homepage");
  });


  const port = process.env.PORT || 7070;
  app.listen(port, "0.0.0.0", () => {
  });
  // Debug login route


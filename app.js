  const express = require('express');
  const app = express();
  require('dotenv').config();
  const { connectToMongo } = require ('./db');
  const morgan = require("morgan");
  const winston = require("winston");
  const fs = require("fs");


const authenticateRoute = require('./Route/authentication');
  const { protect, authorize } = require("./middleware/auth");
  
  // const isAuthenticated = require('./middleware/isAuthenticated');
  const cors = require('cors');
const cookieParser = require("cookie-parser");
  const helmet = require('helmet');
app.use(helmet());

  const productRoute = require('./Route/product');
  const brandRoute = require('./Route/brand');
  const categoryRoute = require('./Route/category');
  const transactionRoute = require('./Route/transaction');


  app.use(helmet());
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

connectToMongo()
  .then(() => {
      console.log("MongoDB connected successfully");
  })

  app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "http://localhost:3000");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      next();
  });

  app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
  app.use(express.json({ limit: "50mb" }));

  app.use("/api/auth", authenticateRoute);
  app.use("/api/product", productRoute); // isAuthenticated protects route
  app.use("/api/brand", brandRoute);
  app.use("/api/category", categoryRoute);
  app.use("/api/transact", protect, transactionRoute);

  app.get("/", (req, res) => {
      res.status(200).send("homepage");
  });


  const port = process.env.PORT || 7070;
  app.listen(port, "0.0.0.0", () => {
  });
  // Debug login route


// index.js
import express, { json } from "express";
import cors from "cors";
import routes from "./routes/routes.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import bodyParser from "body-parser";

dotenv.config();

const allowedOrigins = [
  "https://aes-project.vercel.app", // Front-End Production
  "http://localhost:5173", // Front-End Localhost
  "https://api.cloudinary.com/v1_1/dc3jkijbn/upload", // Cloudinary API
];

const app = express();

app.use(cookieParser());

app.use(cors({
  origin: allowedOrigins,
  methods: ["POST", "GET", "DELETE", "PUT","OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  exposedHeaders: ["set-cookie"],
}));

// Add Cache-Control middleware
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Allow preflight requests
app.options('*', cors());

// Parse incoming requests
app.use(json());
app.use(bodyParser.urlencoded({ extended: true }));

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });

const server = http.createServer(app);

// Define routes
app.use("/", routes);

// Graceful shutdown for Redis client
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await redisClient.quit();
  process.exit(0);
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

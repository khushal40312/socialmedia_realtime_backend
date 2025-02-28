import express from "express";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import CreateApollo from "./graphql/app.js";
import "dotenv/config";
import UserService from "./services/user.js";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from 'graphql-subscriptions';
export const pubsub = new PubSub();
import multer from "multer";
import path from "path";
import { prismaClient } from "./lib/db.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./lib/cloudnary.js";

async function init() {
  const app = express();
  app.use("/uploads", express.static("uploads"));
  // Configure CORS to allow requests from your frontend's URL
  app.use(
    cors({
      origin: process.env.FRONTEND_URL, // Your frontend URL
      credentials: true, // Enable credentials if needed (cookies, etc.)
    })
  );

  app.use(express.json());

  // Create Apollo Server instance with schema
  const { gqlServer, schema } = await CreateApollo();
console.log("Cloudinary Config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Missing",
});


  app.use(
    "/graphql",
    expressMiddleware(gqlServer, {
      context: async ({ req }) => {
        try {
          const token = req.headers["token"];
          if (!token) {
            return null;
          }
          const User = await UserService.decodeToken(token);
          return { User };
        } catch (error) {
          console.error("Authentication Error:", error);
          return {};
        }
      },
    })
  );
 
  
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "profile_pictures", // Cloudinary folder name
      allowed_formats: ["jpg", "jpeg", "png","webp"],
    },
  });
  
  const upload = multer({ storage });
  
  // Upload route
  app.post("/upload", upload.single("picture"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const parsedContext = JSON.parse(req.body.context);
      const userId = parsedContext?.User?.id;
     
      const user = await UserService.findUserById(userId);
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // Update the user profile with the new image URL
      const updatedUser = await prismaClient.user.update({
        where: { id: userId },
        data: {
          picture: req.file.path,
        },
      });
  
      res.json({ message: "Profile picture updated", user: updatedUser });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/test-db", async (req, res) => {
  try {
    await prismaClient.$connect();
    res.json({ success: true, message: "Connected to Supabase!" });
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

  app.get("/", (req, res) => {
    res.send("Hello, WebSocket + GraphQL is running!");
  });

  // Start the HTTP server
  const PORT = process.env.PORT;
  const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });

  // Set up WebSocket Server
  const wsServer = new WebSocketServer({
    server, // Share the same HTTP server
    path: "/graphql", // Same path as your GraphQL endpoint
  });

  useServer(
    {
      schema,
      context: async (ctx) => {
        try {
          const token = ctx.connectionParams?.token;
          if (!token) {
            throw new Error("No token provided");
          }
          const User = await UserService.decodeToken(token);
  
          // Mark user as online globally
          await UserService.setActiveStatus(User.id, true);
  
          return { User, pubsub };
        } catch (error) {
          console.error("WebSocket Authentication Error:", error);
          return {};
        }
      },
      onDisconnect: async (ctx) => {
        try {
          const token = ctx.connectionParams?.token;
          if (!token) {
            throw new Error("No token provided");
          }
          const User = await UserService.decodeToken(token);
  
          // Mark user as offline globally
          await UserService.setActiveStatus(User.id, false);
        } catch (error) {
          console.error("WebSocket Disconnect Error:", error);
        }
      },
    },
    wsServer
  );
  

  console.log(`WebSocket server running at ws://localhost:${PORT}/graphql`);
}

init();


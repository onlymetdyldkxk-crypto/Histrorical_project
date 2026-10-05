import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";

const PORT = parseInt(env.PORT, 10) || 5000;

const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Historical Document Conversion API Server`);
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`⚙️  Environment: ${env.NODE_ENV}`);
  console.log(`==================================================`);
});

// Graceful shutdown handling
async function shutdown() {
  console.log("Shutting down server gracefully...");
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Database connection closed. Exiting process.");
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

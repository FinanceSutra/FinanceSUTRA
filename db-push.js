import { db } from "./server/db.js";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

// This script will create all the tables in the database
console.log("Pushing schema to database...");

try {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Schema pushed successfully!");
} catch (error) {
  console.error("Error pushing schema:", error);
  process.exit(1);
}

process.exit(0);
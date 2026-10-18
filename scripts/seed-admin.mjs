import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema.ts";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function seedAdmin() {
  try {
    const connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    const testAdminOpenId = "test-admin-dev-" + Date.now();
    
    console.log("Creating test admin user...");
    await db.insert(users).values({
      openId: testAdminOpenId,
      name: "Test Admin",
      email: "admin@test.local",
      loginMethod: "test",
      role: "admin",
      lastSignedIn: new Date(),
    });

    console.log("✓ Test admin user created!");
    console.log(`  openId: ${testAdminOpenId}`);
    console.log(`  email: admin@test.local`);
    console.log(`  role: admin`);
    console.log("\nTo use this account, you need to:");
    console.log("1. Create a session token manually");
    console.log("2. Or use the admin bypass endpoint (if implemented)");

    await connection.end();
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();

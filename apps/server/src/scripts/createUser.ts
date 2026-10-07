import crypto from "node:crypto";
import readline from "node:readline";
import bcrypt from "bcryptjs";
import { getDb } from "../db/index.js";

async function prompt(query: string, hideInput = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (hideInput && process.stdin.isTTY) {
      process.stdout.write(query);
      let input = "";
      process.stdin.setRawMode(true);
      process.stdin.resume();

      const onData = (char: Buffer) => {
        const str = char.toString("utf8");
        if (str === "\n" || str === "\r" || str === "\u0004") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener("data", onData);
          rl.close();
          console.log();
          resolve(input.trim());
        } else if (str === "\u0003") {
          // Ctrl+C
          process.exit(1);
        } else if (str === "\u007f" || str === "\b") {
          if (input.length > 0) {
            input = input.slice(0, -1);
          }
        } else {
          input += str;
        }
      };

      process.stdin.on("data", onData);
    } else {
      rl.question(query, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

export async function createUser() {
  const args = process.argv.slice(2);
  let email = args[0];
  let password = args[1];

  if (!email) {
    email = await prompt("Enter email: ");
  }

  if (!password) {
    password = await prompt("Enter password: ", true);
  }

  if (!email || !password) {
    console.error("Error: Email and password are required.");
    process.exit(1);
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE lower(email) = lower(?)").get(email);

  if (existing) {
    console.error(`Error: User with email "${email}" already exists.`);
    process.exit(1);
  }

  const id = crypto.randomUUID();
  const password_hash = bcrypt.hashSync(password, 10);
  const role = "admin";

  db.prepare(
    "INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)"
  ).run(id, email, password_hash, role);

  console.log(`✓ User successfully created!`);
  console.log(`  ID: ${id}`);
  console.log(`  Email: ${email}`);
  console.log(`  Role: ${role}`);
}

if (process.env.NODE_ENV !== "test") {
  createUser().catch((err) => {
    console.error("Failed to create user:", err);
    process.exit(1);
  });
}

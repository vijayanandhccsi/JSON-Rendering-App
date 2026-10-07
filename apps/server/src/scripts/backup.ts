import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export function runBackup(maxKeep = 7): string {
  const rootDir = process.cwd();
  const dbRelativePath = process.env.DATABASE_PATH || "certkraft.db";
  const dbPath = path.resolve(rootDir, dbRelativePath);
  const envPath = path.resolve(rootDir, ".env");
  const backupsDir = path.resolve(rootDir, "backups");

  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFolder = path.join(backupsDir, `backup-${timestamp}`);

  fs.mkdirSync(backupFolder, { recursive: true });

  // 1. Copy SQLite DB if exists
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, path.join(backupFolder, path.basename(dbPath)));
  }

  // 2. Copy .env if exists
  if (fs.existsSync(envPath)) {
    fs.copyFileSync(envPath, path.join(backupFolder, ".env"));
  }

  // 3. Keep latest `maxKeep` backups
  const existingBackups = fs
    .readdirSync(backupsDir)
    .filter((name) => name.startsWith("backup-"))
    .map((name) => ({
      name,
      fullPath: path.join(backupsDir, name),
      ctime: fs.statSync(path.join(backupsDir, name)).ctimeMs,
    }))
    .sort((a, b) => b.ctime - a.ctime);

  if (existingBackups.length > maxKeep) {
    const toDelete = existingBackups.slice(maxKeep);
    for (const folder of toDelete) {
      fs.rmSync(folder.fullPath, { recursive: true, force: true });
    }
  }

  return backupFolder;
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const backupFolder = runBackup();
    console.log(`Backup completed successfully: ${backupFolder}`);
  } catch (err: unknown) {
    console.error("Backup failed:", err);
    process.exit(1);
  }
}

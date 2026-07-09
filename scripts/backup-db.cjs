#!/usr/bin/env node
/**
 * SQLite Backup Script — Shiv Furniture Works ERP
 *
 * Usage:
 *   node scripts/backup-db.cjs                   # Creates timestamped backup
 *   node scripts/backup-db.cjs --restore <file>  # Restores from backup file
 *   node scripts/backup-db.cjs --list            # Lists available backups
 *   node scripts/backup-db.cjs --clean 7         # Delete backups older than 7 days
 *
 * Schedule with cron (Linux/macOS):
 *   0 2 * * * cd /app && node scripts/backup-db.cjs >> /var/log/erp-backup.log 2>&1
 *
 * Schedule with Task Scheduler (Windows):
 *   schtasks /create /tn "ERP Backup" /tr "node D:\Project\mini-erp\scripts\backup-db.cjs" /sc daily /st 02:00
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../prisma/dev.db');
const BACKUP_DIR = path.resolve(__dirname, '../backups');

// ─── Utilities ────────────────────────────────────────────────────────────────

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`[BACKUP] Created backup directory: ${BACKUP_DIR}`);
  }
}

function timestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

// ─── Backup ───────────────────────────────────────────────────────────────────

function createBackup() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`[BACKUP] ERROR: Database not found at ${DB_PATH}`);
    process.exit(1);
  }

  ensureBackupDir();

  const filename = `erp-backup-${timestamp()}.db`;
  const destPath = path.join(BACKUP_DIR, filename);

  try {
    fs.copyFileSync(DB_PATH, destPath);
    const stats = fs.statSync(destPath);
    console.log(`[BACKUP] ✓ Backup created: ${filename} (${formatSize(stats.size)})`);
    console.log(`[BACKUP] ✓ Location: ${destPath}`);
    return destPath;
  } catch (err) {
    console.error('[BACKUP] ERROR: Failed to create backup:', err.message);
    process.exit(1);
  }
}

// ─── Restore ──────────────────────────────────────────────────────────────────

function restoreBackup(backupFile) {
  const backupPath = path.isAbsolute(backupFile)
    ? backupFile
    : path.join(BACKUP_DIR, backupFile);

  if (!fs.existsSync(backupPath)) {
    console.error(`[RESTORE] ERROR: Backup file not found: ${backupPath}`);
    process.exit(1);
  }

  // Safety: make a pre-restore backup of current DB
  if (fs.existsSync(DB_PATH)) {
    const safetyFile = path.join(BACKUP_DIR, `pre-restore-${timestamp()}.db`);
    fs.copyFileSync(DB_PATH, safetyFile);
    console.log(`[RESTORE] Safety backup created: ${path.basename(safetyFile)}`);
  }

  try {
    fs.copyFileSync(backupPath, DB_PATH);
    const stats = fs.statSync(DB_PATH);
    console.log(`[RESTORE] ✓ Restored from: ${path.basename(backupPath)} (${formatSize(stats.size)})`);
  } catch (err) {
    console.error('[RESTORE] ERROR: Failed to restore backup:', err.message);
    process.exit(1);
  }
}

// ─── List ─────────────────────────────────────────────────────────────────────

function listBackups() {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .map(f => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      return { name: f, size: stats.size, mtime: stats.mtime };
    })
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) {
    console.log('[BACKUP] No backups found.');
    return;
  }

  console.log(`\n[BACKUP] Found ${files.length} backup(s) in ${BACKUP_DIR}:\n`);
  files.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.name}`);
    console.log(`     Size: ${formatSize(f.size)}  |  Created: ${f.mtime.toLocaleString()}`);
  });
  console.log('');
}

// ─── Clean ────────────────────────────────────────────────────────────────────

function cleanOldBackups(days) {
  ensureBackupDir();
  const maxAge = Number(days) * 86400_000;
  const now = Date.now();
  let deleted = 0;

  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.db'));
  for (const file of files) {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtime.getTime() > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`[BACKUP] Deleted old backup: ${file}`);
      deleted++;
    }
  }

  console.log(`[BACKUP] Cleaned ${deleted} backup(s) older than ${days} days.`);
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--restore') || args.includes('-r')) {
  const idx = args.indexOf('--restore') !== -1 ? args.indexOf('--restore') : args.indexOf('-r');
  const file = args[idx + 1];
  if (!file) {
    console.error('[RESTORE] ERROR: Provide a backup filename. Usage: --restore <file>');
    process.exit(1);
  }
  restoreBackup(file);
} else if (args.includes('--list') || args.includes('-l')) {
  listBackups();
} else if (args.includes('--clean') || args.includes('-c')) {
  const idx = args.indexOf('--clean') !== -1 ? args.indexOf('--clean') : args.indexOf('-c');
  const days = args[idx + 1] || 30;
  cleanOldBackups(days);
} else {
  // Default: create backup
  createBackup();
}

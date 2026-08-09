import { NextResponse } from 'next/server'
import { readdirSync, statSync, readFileSync, unlinkSync, existsSync, writeFileSync, createReadStream } from 'fs'
import { join, relative, sep } from 'path'
import { tmpdir } from 'os'
import { gzipSync } from 'zlib'

export const runtime = 'nodejs'

/* ------------------------------------------------------------------ */
/*  Configuration                                                       */
/* ------------------------------------------------------------------ */

const PROJECT_ROOT = process.cwd()

// Top-level entries to include (directories are walked recursively)
const INCLUDE_ENTRIES = [
  'src',
  'prisma',
  'public',
  'scripts',
]

// Top-level files to include
const INCLUDE_FILES = [
  'README.md',
  'package.json',
  'bun.lock',
  'tsconfig.json',
  'next.config.ts',
  'tailwind.config.ts',
  'postcss.config.mjs',
  'eslint.config.mjs',
  'components.json',
  'next-env.d.ts',
  'Caddyfile',
]

// Directory/file name patterns to skip during recursive walk
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  'tool-results',
  'download',
  'agent-ctx',
  'mini-services',
  'examples',
  'db',
]

// File extensions to skip
const EXCLUDE_EXTENSIONS = [
  '.db',
  '.db-journal',
  '.log',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.ico',
]

// Specific top-level files to always skip
const EXCLUDE_FILES = [
  'dev.log',
  'worklog.md',
  'homepage.png',
  'admin-dashboard.png',
  'admin-dash-final.png',
  'cart-drawer.png',
  'qa-hero-v2.png',
  'qa-hero-v3.png',
  'qa-homepage.png',
  'qa-homepage-v2.png',
  'qa-homepage-bottom.png',
  'qa-shop.png',
  'qa-shop-page.png',
  'qa-shop-filtered.png',
  'qa-shop2.png',
  'qa-product-detail.png',
  'qa-product-detail2.png',
  'qa-product.png',
  'qa-cart-drawer.png',
  'qa-admin-dashboard.png',
  'qa-admin-categories.png',
  'qa-admin-reviews.png',
  'qa-admin-reviews-page.png',
  'qa-comparison-page.png',
  'qa-screenshot-1.png',
  'qa-homepage-enhanced.png',
  'qa4-home.png',
  'qa4-dark.png',
  'qa4-orders.png',
  'qa4-product.png',
  'qa4-cart-coupon.png',
  'qa4-shop.png',
  'qa-shop-dark.png',
  'qa5-home.png',
  'qa5-home-top.png',
  'qa5-home-mid.png',
  'qa5-home-bottom.png',
  'qa5-home-clean.png',
  'qa-final-home.png',
  'qa-final-mid.png',
  'qa-final-shop.png',
  'qa-final-shop2.png',
  'qa-final-dark.png',
  'qa-final-footer.png',
  'qa-final-checkout.png',
  'qa3-home.png',
  'qa3-home-top.png',
  'qa3-home-mid.png',
  'qa3-home-bottom.png',
  'qa3-shop.png',
  'qa3-admin.png',
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

interface FileEntry {
  path: string   // absolute path on disk
  rel: string    // relative path from project root (for archive naming)
  size: number
}

function shouldExclude(name: string, isDir: boolean): boolean {
  // Check directory/file name exclusions
  if (EXCLUDE_PATTERNS.includes(name)) return true
  // Check specific file exclusions
  if (!isDir && EXCLUDE_FILES.includes(name)) return true
  // Check extension exclusions for files
  if (!isDir) {
    const ext = name.startsWith('.') ? name : ('.' + name.split('.').pop())
    if (EXCLUDE_EXTENSIONS.includes(ext)) return true
  }
  return false
}

function collectFiles(): FileEntry[] {
  const files: FileEntry[] = []

  function walk(dirPath: string) {
    let entries: string[]
    try {
      entries = readdirSync(dirPath, { withFileTypes: true })
        .filter(e => {
          if (shouldExclude(e.name, e.isDirectory())) return false
          // Skip hidden files/dirs (except well-known ones)
          if (e.name.startsWith('.') && !['.env.example'].includes(e.name)) return false
          return true
        })
        .map(e => ({
          name: e.name,
          isDir: e.isDirectory(),
          path: join(dirPath, e.name),
        }))
    } catch {
      return
    }

    // Sort: directories first, then files, alphabetically
    entries.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1
      if (!a.isDir && b.isDir) return 1
      return a.name.localeCompare(b.name)
    })

    for (const entry of entries) {
      const rel = relative(PROJECT_ROOT, entry.path).split(sep).join('/')
      if (entry.isDir) {
        walk(entry.path)
      } else {
        try {
          files.push({ path: entry.path, rel, size: statSync(entry.path).size })
        } catch { /* skip unreadable files */ }
      }
    }
  }

  // Walk included directories
  for (const dir of INCLUDE_ENTRIES) {
    const dirPath = join(PROJECT_ROOT, dir)
    if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
      walk(dirPath)
    }
  }

  // Add individual top-level files
  for (const file of INCLUDE_FILES) {
    const filePath = join(PROJECT_ROOT, file)
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      try {
        files.push({ path: filePath, rel: file, size: statSync(filePath).size })
      } catch { /* skip */ }
    }
  }

  return files
}

/* ------------------------------------------------------------------ */
/*  Tar archive builder (pure Node.js, no external deps)                */
/* ------------------------------------------------------------------ */

function paxSize(size: number): string {
  const s = size.toString()
  const len = s.length
  const total = len + 1 + Math.ceil(len / 3) // digits + space + padding
  const prefix = (total + 5).toString().padStart(6, '0') + ' '  // includes "length " prefix
  return `${prefix}${s}\n`
}

function buildTarBuffer(files: FileEntry[]): Buffer {
  // Each tar entry = 512-byte header + file content padded to 512-byte boundary
  // End of archive = two 512-byte blocks of zeros
  const parts: Buffer[] = []

  for (const file of files) {
    let content: Buffer
    try {
      content = readFileSync(file.path)
    } catch {
      continue
    }

    const name = `NOVA-Store/${file.rel}`
    const nameBytes = Buffer.from(name, 'utf8')
    const size = content.length
    const mode = 0o644
    const mtime = Math.floor(Date.now() / 1000)

    // Check if we need a PAX extended header for long filenames (>100 bytes)
    const needsPax = nameBytes.length > 99

    if (needsPax) {
      // PAX extended header
      const paxPath = `NOVA-Store/${file.rel}`
      const paxData = `30 path=${paxPath}\n`
      const paxHeader = Buffer.alloc(512)
      // typeflag 'x' for PAX extended header
      paxHeader.write('PaxHeaders.00000/', 0)
      paxHeader.write((mode).toString(8).padStart(7, '0') + '\0', 100, 8)
      paxHeader.write((0).toString(8).padStart(7, '0') + '\0', 108, 8)
      paxHeader.write((0).toString(8).padStart(7, '0') + '\0', 116, 8)
      paxHeader.write((size).toString(8).padStart(11, '0') + '\0', 124, 12)
      paxHeader.write('x', 156) // typeflag
      paxHeader.write('ustar\0', 257)
      paxHeader.write('00', 263)
      // Compute checksum
      let sum = 0
      for (let i = 0; i < 512; i++) sum += paxHeader[i]
      paxHeader.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8)
      parts.push(paxHeader)

      // PAX data
      const paxDataBuf = Buffer.from(paxData, 'utf8')
      const paxPadded = Buffer.alloc(Math.ceil(paxDataBuf.length / 512) * 512)
      paxDataBuf.copy(paxPadded)
      parts.push(paxPadded)
    }

    // Standard tar header (512 bytes)
    const header = Buffer.alloc(512)
    // File name (100 bytes)
    const nameField = needsPax ? '././@LongLink'.substring(0, 100) : name.substring(0, 100)
    header.write(nameField, 0)
    // File mode (8 bytes)
    header.write(mode.toString(8).padStart(7, '0') + '\0', 100, 8)
    // Owner UID (8 bytes)
    header.write('1000\0\0\0\0', 108, 8)
    // Owner GID (8 bytes)
    header.write('1000\0\0\0\0', 116, 8)
    // File size in octal (12 bytes)
    header.write(size.toString(8).padStart(11, '0') + '\0', 124, 12)
    // Modification time (12 bytes)
    header.write(mtime.toString(8).padStart(11, '0') + '\0', 136, 12)
    // Checksum placeholder (8 bytes)
    header.write('        ', 148, 8)
    // Type flag - '0' = regular file
    header.write('0', 156)
    // Magic "ustar" + version
    header.write('ustar\0', 257)
    header.write('00', 263)

    // Compute and write checksum
    let chksum = 0
    for (let i = 0; i < 512; i++) chksum += header[i]
    header.write(chksum.toString(8).padStart(6, '0') + '\0 ', 148, 8)

    parts.push(header)

    // File content (padded to 512-byte boundary)
    const paddedSize = Math.ceil(size / 512) * 512
    const padded = Buffer.alloc(paddedSize)
    content.copy(padded)
    parts.push(padded)
  }

  // End-of-archive marker (two 512-byte zero blocks)
  parts.push(Buffer.alloc(1024))

  return Buffer.concat(parts)
}

/* ------------------------------------------------------------------ */
/*  Route Handler                                                       */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const files = collectFiles()

    if (files.length === 0) {
      return NextResponse.json({ error: 'No source files found' }, { status: 500 })
    }

    // Build tar archive in memory
    const tarBuffer = buildTarBuffer(files)

    // Compress with gzip (synchronous for simplicity)
    const gzipped = gzipSync(tarBuffer, { level: 9 })
    const tmpPath = join(tmpdir(), `nova-store-source-${Date.now()}.tar.gz`)
    writeFileSync(tmpPath, gzipped)

    const fileSize = statSync(tmpPath).size
    const fileStream = createReadStream(tmpPath)

    // Clean up temp file after streaming
    const cleanup = () => { try { unlinkSync(tmpPath) } catch { /* ignore */ } }
    fileStream.on('end', cleanup)
    fileStream.on('error', cleanup)

    return new NextResponse(fileStream as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': 'attachment; filename="NOVA-Store-Source-Code.tar.gz"',
        'Content-Length': fileSize.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Source code download error:', error)
    return NextResponse.json({ error: 'Failed to generate source code archive' }, { status: 500 })
  }
}

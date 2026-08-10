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
  'upload',
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
  if (EXCLUDE_PATTERNS.includes(name)) return true
  if (!isDir && EXCLUDE_FILES.includes(name)) return true
  if (!isDir) {
    const ext = name.startsWith('.') ? name : ('.' + name.split('.').pop())
    if (EXCLUDE_EXTENSIONS.includes(ext)) return true
  }
  return false
}

interface DirEntry {
  name: string
  isDir: boolean
  path: string
}

function collectFiles(): FileEntry[] {
  const files: FileEntry[] = []

  function walk(dirPath: string) {
    let entries: DirEntry[]
    try {
      const dirents = readdirSync(dirPath, { withFileTypes: true })
        .filter(e => {
          if (shouldExclude(e.name, e.isDirectory())) return false
          if (e.name.startsWith('.') && e.name !== '.env.example') return false
          return true
        })
      entries = dirents.map(e => ({
        name: e.name,
        isDir: e.isDirectory(),
        path: join(dirPath, e.name),
      }))
    } catch {
      return
    }

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

  for (const dir of INCLUDE_ENTRIES) {
    const dirPath = join(PROJECT_ROOT, dir)
    if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
      walk(dirPath)
    }
  }

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

function buildTarBuffer(files: FileEntry[]): Buffer {
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
    const needsPax = nameBytes.length > 99

    if (needsPax) {
      const paxData = `30 path=${name}\n`
      const paxHeader = Buffer.alloc(512)
      paxHeader.write('PaxHeaders.00000/', 0)
      paxHeader.write(mode.toString(8).padStart(7, '0') + '\0', 100, 8)
      paxHeader.write('0'.toString(8).padStart(7, '0') + '\0', 108, 8)
      paxHeader.write('0'.toString(8).padStart(7, '0') + '\0', 116, 8)
      paxHeader.write(size.toString(8).padStart(11, '0') + '\0', 124, 12)
      paxHeader.write('x', 156)
      paxHeader.write('ustar\0', 257)
      paxHeader.write('00', 263)
      let sum = 0
      for (let i = 0; i < 512; i++) sum += paxHeader[i]
      paxHeader.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8)
      parts.push(paxHeader)

      const paxDataBuf = Buffer.from(paxData, 'utf8')
      const paxPadded = Buffer.alloc(Math.ceil(paxDataBuf.length / 512) * 512)
      paxDataBuf.copy(paxPadded)
      parts.push(paxPadded)
    }

    const header = Buffer.alloc(512)
    const nameField = needsPax ? '././@LongLink'.substring(0, 100) : name.substring(0, 100)
    header.write(nameField, 0)
    header.write(mode.toString(8).padStart(7, '0') + '\0', 100, 8)
    header.write('1000\0\0\0\0', 108, 8)
    header.write('1000\0\0\0\0', 116, 8)
    header.write(size.toString(8).padStart(11, '0') + '\0', 124, 12)
    header.write(mtime.toString(8).padStart(11, '0') + '\0', 136, 12)
    header.write('        ', 148, 8)
    header.write('0', 156)
    header.write('ustar\0', 257)
    header.write('00', 263)

    let chksum = 0
    for (let i = 0; i < 512; i++) chksum += header[i]
    header.write(chksum.toString(8).padStart(6, '0') + '\0 ', 148, 8)

    parts.push(header)

    const paddedSize = Math.ceil(size / 512) * 512
    const padded = Buffer.alloc(paddedSize)
    content.copy(padded)
    parts.push(padded)
  }

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

    const tarBuffer = buildTarBuffer(files)
    const gzipped = gzipSync(tarBuffer, { level: 9 })
    const tmpPath = join(tmpdir(), `nova-store-source-${Date.now()}.tar.gz`)
    writeFileSync(tmpPath, gzipped)

    const fileSize = statSync(tmpPath).size
    const fileStream = createReadStream(tmpPath)

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

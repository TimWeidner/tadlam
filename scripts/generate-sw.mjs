import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const output = join(process.cwd(), 'dist')

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? filesIn(path) : [path]
  }))
  return nested.flat()
}

const allFiles = await filesIn(output)
const precache = ['/', ...allFiles
  .filter((file) => !file.endsWith('sw.js'))
  .map((file) => `/${relative(output, file).replaceAll('\\', '/')}`)]
const serviceWorker = join(output, 'sw.js')
const source = await readFile(serviceWorker, 'utf8')
await writeFile(serviceWorker, source.replace('/*__TADLAM_PRECACHE__*/', precache.map(JSON.stringify).join(',')))

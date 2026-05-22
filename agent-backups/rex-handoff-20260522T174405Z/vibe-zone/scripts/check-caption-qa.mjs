#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const targets = process.argv.slice(2)

async function findQaFiles(dir) {
  const { readdir } = await import('node:fs/promises')
  const out = []
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true }).catch(() => [])
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) await walk(full)
      else if (entry.name.endsWith('.qa.json')) out.push(full)
    }
  }
  await walk(dir)
  return out
}

const qaFiles = targets.length ? targets.map((item) => path.resolve(root, item)) : await findQaFiles(path.join(root, 'media'))
let failed = 0
for (const file of qaFiles) {
  const payload = JSON.parse(await readFile(file, 'utf8'))
  const rel = path.relative(root, file)
  if (!payload.ok) {
    failed++
    console.error(`FAIL ${rel}: ${(payload.failures || []).join('; ')}`)
  } else {
    console.log(`OK   ${rel}: ${payload.eventCount} ${payload.mode} events`)
  }
}
if (!qaFiles.length) console.log('No caption QA files found yet.')
if (failed) process.exit(1)

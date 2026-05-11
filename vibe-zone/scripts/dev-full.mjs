import { spawn } from 'node:child_process'
const children = [
  spawn('node', ['server/server.mjs'], { stdio: 'inherit', env: { ...process.env, PORT: process.env.API_PORT || '8787' } }),
  spawn('npx', ['vite', '--host', '127.0.0.1'], { stdio: 'inherit', env: { ...process.env } }),
]
const stop = () => { for (const child of children) child.kill('SIGTERM') }
process.on('SIGINT', stop); process.on('SIGTERM', stop)

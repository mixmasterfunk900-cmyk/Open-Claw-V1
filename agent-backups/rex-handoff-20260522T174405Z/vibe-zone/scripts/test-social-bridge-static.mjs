import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const server = await readFile(new URL('../server/server.mjs', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/App.css', import.meta.url), 'utf8')

const checks = [
  ['manual result type', app.includes('type ManualPostResult')],
  ['manual result component', app.includes('function DispatchManualResultForm')],
  ['manual result UI copy', app.includes('Manual post result ledger')],
  ['manual posted status action', app.includes("Record posted manually")],
  ['copy override type', app.includes('type PlatformCopyOverride')],
  ['copy override component', app.includes('function DispatchCopyOverrideEditor')],
  ['copy override UI copy', app.includes('Per-platform draft copy') && app.includes('Save draft copy')],
  ['server normalizes copy overrides', server.includes('function normalizeCopyOverrides')],
  ['server normalizes manual results', server.includes('function normalizeManualResult')],
  ['server records postResults ledger', server.includes("db.postResults = [{ id: id('post_result')")],
  ['server allows style rework status', server.includes("'style_rework_needed'")],
  ['manual result styles', css.includes('.manual-result-ledger') && css.includes('.manual-result-inputs')],
  ['copy override styles', css.includes('.copy-override-editor') && css.includes('.copy-override-grid')],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  console.error('Social Bridge static contract failed:')
  for (const [name] of failed) console.error(`- ${name}`)
  process.exit(1)
}

console.log(`Social Bridge static contract passed (${checks.length} checks).`)

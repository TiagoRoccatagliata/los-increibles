// "Seed" = sincronizar desde el Google Sheet del consorcio (fuente de verdad).
import 'dotenv/config'
import { syncFromSheet } from '../src/lib/sync'
import { getPortfolio } from '../src/lib/portfolio'
import { investedUsd, profitUsd } from '../src/lib/metrics'

async function main() {
  const r = await syncFromSheet()
  console.log(r.ok ? `Sync OK: ${r.message}` : `Sync FALLÓ: ${r.message}`)
  if (!r.ok) process.exit(1)

  const props = await getPortfolio()
  for (const p of props) {
    console.log(
      `- ${p.name} [${p.status}] egresos=${investedUsd(p).toFixed(2)} ganancia=${profitUsd(p).toFixed(2)}`,
    )
  }
}

main().then(() => process.exit(0))

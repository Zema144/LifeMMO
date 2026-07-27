import { spawn } from "node:child_process"
import { setTimeout as delay } from "node:timers/promises"

const port = process.env.PORT ?? "3000"
const url = `http://localhost:${port}`

function spawnProcess(command, args, options = {}) {
  return spawn(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: port,
    },
    stdio: options.stdio ?? "inherit",
    windowsHide: true,
  })
}

async function waitForServer() {
  const started = Date.now()
  const timeoutMs = 120_000

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status >= 400) return
    } catch {
      // Server is still booting.
    }

    await delay(500)
  }

  throw new Error(`Timed out waiting for ${url}`)
}

function killProcessTree(child) {
  if (!child.pid || child.exitCode !== null) return Promise.resolve()

  return new Promise((resolve) => {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    })
    killer.on("exit", () => resolve())
    killer.on("error", () => resolve())
  })
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.on("exit", (code) => resolve(code ?? 1))
    child.on("error", reject)
  })
}

const next = spawnProcess(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--port", port])

let exitCode = 1

try {
  await waitForServer()

  const playwright = spawnProcess(process.execPath, ["node_modules/@playwright/test/cli.js", "test"], {
    stdio: "inherit",
  })

  exitCode = await waitForExit(playwright)
} finally {
  await killProcessTree(next)
}

process.exit(exitCode)

export function getSeedPassword(envName: string = "SEED_PASSWORD"): string {
  const password = process.env.SEED_PASSWORD || process.env[envName] || process.env["SEED_CORE_ACCOUNTS_PASSWORD"]

  if (!password) {
    throw new Error(`Missing required seed password environment variable: ${envName}`)
  }

  return password
}

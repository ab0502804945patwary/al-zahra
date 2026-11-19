// Creates the first (or another) administrator for the ERP.
//
// Usage (from the project folder):
//   node scripts/create-admin.mjs
// It asks for the email, the name and a password (the password is not shown while typing).
// It needs .env.local (or environment variables) with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import readline from 'node:readline'

// load .env.local if present
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=')
    if (i > 0 && !line.trim().startsWith('#')) process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim()
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key || url.includes('your')) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (put them in .env.local).')
  process.exit(1)
}

const interactive = Boolean(process.stdin.isTTY)
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: interactive })
const lines = rl[Symbol.asyncIterator]()
async function ask(q, hidden = false) {
  process.stdout.write(q)
  let orig
  if (hidden && interactive) { orig = rl._writeToOutput; rl._writeToOutput = () => {} }
  const { value } = await lines.next()
  if (hidden && interactive) { rl._writeToOutput = orig; process.stdout.write('\n') }
  return (value ?? '').toString()
}

const email = (await ask('Admin email: ')).trim().toLowerCase()
const name = (await ask('Full name: ')).trim()
const password = await ask('Password (min 8 characters): ', true)
const again = await ask('Repeat password: ', true)
rl.close()

if (!/^\S+@\S+\.\S+$/.test(email)) { console.error('That email does not look right.'); process.exit(1) }
if (!name) { console.error('Name is required.'); process.exit(1) }
if (password.length < 8) { console.error('Password must be at least 8 characters.'); process.exit(1) }
if (password !== again) { console.error('The two passwords do not match.'); process.exit(1) }

const db = createClient(url, key, { auth: { persistSession: false } })
const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true })
if (error || !data.user) { console.error('Could not create the login: ' + (error?.message || 'unknown error')); process.exit(1) }

const { error: rowError } = await db.from('employees').insert([{
  user_id: data.user.id, name, email, role: 'admin', assigned_stages: [], is_active: true,
}])
if (rowError) {
  await db.auth.admin.deleteUser(data.user.id)
  console.error('Could not save the staff row: ' + rowError.message)
  process.exit(1)
}
console.log(`\nDone. ${name} (${email}) can now sign in as administrator.`)
console.log('Next: sign in, open Settings and set the Master password.')

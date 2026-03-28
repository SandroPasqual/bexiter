import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(supabaseUrl, supabaseKey)

const command = process.argv[2]
const arg = process.argv[3]

async function listUsers() {
  const { data, error } = await admin.auth.admin.listUsers()
  if (error) { console.error(error.message); return }
  
  console.log(`\n${'EMAIL'.padEnd(40)} ${'CREATED'.padEnd(22)} CONFIRMED`)
  console.log('-'.repeat(80))
  for (const u of data.users) {
    const email = (u.email || 'no-email').padEnd(40)
    const created = new Date(u.created_at).toLocaleDateString().padEnd(22)
    const confirmed = u.email_confirmed_at ? '✓' : '✗'
    console.log(`${email} ${created} ${confirmed}`)
  }
  console.log(`\nTotal: ${data.users.length} users\n`)
}

async function deleteUser(email: string) {
  const { data } = await admin.auth.admin.listUsers()
  const user = data.users.find(u => u.email === email)
  if (!user) { console.log(`User ${email} not found`); return }
  
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) { console.error(error.message); return }
  console.log(`Deleted: ${email}`)
}

async function deleteAllTest(keepEmail: string) {
  const { data } = await admin.auth.admin.listUsers()
  const toDelete = data.users.filter(u => u.email !== keepEmail)
  
  for (const u of toDelete) {
    await admin.auth.admin.deleteUser(u.id)
    console.log(`Deleted: ${u.email}`)
  }
  console.log(`\nKept: ${keepEmail}`)
}

async function deleteNotes() {
  const { error } = await admin.from('notes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) { console.error(error.message); return }
  console.log('All notes deleted')
}

async function stats() {
  const [notes, folders, tags, users] = await Promise.all([
    admin.from('notes').select('id', { count: 'exact', head: true }),
    admin.from('folders').select('id', { count: 'exact', head: true }),
    admin.from('tags').select('id', { count: 'exact', head: true }),
    admin.auth.admin.listUsers()
  ])
  
  console.log(`\nNotes:   ${notes.count || 0}`)
  console.log(`Folders: ${folders.count || 0}`)
  console.log(`Tags:    ${tags.count || 0}`)
  console.log(`Users:   ${users.data?.users.length || 0}\n`)
}

async function runSql(sql: string) {
  const { error } = await admin.rpc('exec_sql', { sql_text: sql })
  if (error) {
    console.error('Error:', error.message)
    return
  }
  console.log('Done:', sql.substring(0, 50) + '...')
}

async function main() {
  switch (command) {
    case 'list-users':
      await listUsers()
      break
    case 'delete-user':
      if (!arg) { console.error('Usage: delete-user <email>'); process.exit(1) }
      await deleteUser(arg)
      break
    case 'delete-all-test':
      if (!arg) { console.error('Usage: delete-all-test <keep-email>'); process.exit(1) }
      await deleteAllTest(arg)
      break
    case 'delete-notes':
      await deleteNotes()
      break
    case 'stats':
      await stats()
      break
    default:
      console.log(`
Bexiter Supabase Admin

Commands:
  list-users                    List all users
  delete-user <email>           Delete a specific user
  delete-all-test <keep-email>  Delete all users except the one specified
  delete-notes                  Delete all notes (all users)
  stats                         Show database statistics

Examples:
  npx ts-node scripts/supabase-admin.ts list-users
  npx ts-node scripts/supabase-admin.ts delete-user test@example.com
  npx ts-node scripts/supabase-admin.ts delete-all-test bexitervlog@gmail.com
`)
  }
}

main().catch(console.error)

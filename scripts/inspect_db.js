import postgres from "postgres";

const projectRef = "aogbfpfxoqyummgyxgwn";
console.log(`\n=== Supabase Database Inspector ===`);
const password = prompt("Enter your Supabase database password: ");

if (!password) {
  console.error("Error: Database password is required.");
  process.exit(1);
}

const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
const sql = postgres(connectionString);

try {
  console.log("\n1. Fetching columns for table 'holding_cards'...");
  const columns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'holding_cards'
  `;
  
  if (columns.length === 0) {
    console.log("❌ Table 'holding_cards' does not exist in schema 'public'!");
  } else {
    console.log("Table columns:");
    columns.forEach(col => {
      console.log(` - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
  }

  console.log("\n2. Checking Row Level Security (RLS) status...");
  const rlsStatus = await sql`
    SELECT relname, relrowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'holding_cards'
  `;
  
  if (rlsStatus.length > 0) {
    console.log(`RLS Enabled: ${rlsStatus[0].relrowsecurity}`);
  }

  console.log("\n3. Fetching active policies...");
  const policies = await sql`
    SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'holding_cards'
  `;
  
  if (policies.length === 0) {
    console.log("No active policies found.");
  } else {
    policies.forEach(p => {
      console.log(` - Policy: ${p.policyname} (Command: ${p.cmd}, Roles: ${p.roles})`);
      console.log(`   USING definition: ${p.qual}`);
      console.log(`   WITH CHECK definition: ${p.with_check}`);
    });
  }

} catch (err) {
  console.error("\n❌ Error inspecting database:", err.message);
} finally {
  await sql.end();
}

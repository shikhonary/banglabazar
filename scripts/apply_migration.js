import postgres from "postgres";

const projectRef = "aogbfpfxoqyummgyxgwn";
console.log(`\n=== Supabase Migration Tool ===`);
console.log(`Targeting Project: ${projectRef}\n`);

// Prompt user for their database password
const password = prompt("Enter your Supabase database password: ");

if (!password) {
  console.error("Error: Database password is required.");
  process.exit(1);
}

// Direct connection string
const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;

const sqlQuery = `
-- Disable Row Level Security on holding_cards
ALTER TABLE public.holding_cards DISABLE ROW LEVEL SECURITY;

-- Make user_id nullable and drop the foreign key constraint to auth.users if it exists
ALTER TABLE public.holding_cards DROP CONSTRAINT IF EXISTS holding_cards_user_id_fkey;
ALTER TABLE public.holding_cards ALTER COLUMN user_id DROP NOT NULL;

-- Explicitly grant permissions to anon, authenticated, and service_role
GRANT ALL ON public.holding_cards TO anon;
GRANT ALL ON public.holding_cards TO authenticated;
GRANT ALL ON public.holding_cards TO service_role;
`;

console.log("Connecting to Supabase Database...");
const sql = postgres(connectionString);

try {
  await sql.unsafe(sqlQuery);
  console.log("\n✅ Success! Migration applied successfully.");
  console.log("Row Level Security (RLS) has been disabled on holding_cards, and anonymous access is allowed.");
} catch (err) {
  console.error("\n❌ Error applying migration:", err.message);
} finally {
  await sql.end();
}

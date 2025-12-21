import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is not set in environment variables');
	process.exit(1);
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function migrate() {
	console.log('Starting migration: Adding organizationId to restaurants...');

	try {
		// Step 1: Add column (if not exists)
		console.log('Step 1: Adding organization_id column...');
		await db.execute(sql`
			ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS organization_id text;
		`);

		// Step 2: Get the first organization
		console.log('Step 2: Getting first organization...');
		const orgs = await db.execute<{ id: string }>(sql`
			SELECT id FROM organization ORDER BY "createdAt" ASC LIMIT 1;
		`);

		if (orgs.length === 0) {
			console.error('No organizations found! Please create an organization first.');
			await client.end();
			process.exit(1);
		}

		const firstOrgId = orgs[0].id;
		console.log(`First organization ID: ${firstOrgId}`);

		// Step 3: Update existing restaurants
		console.log('Step 3: Assigning existing restaurants to first organization...');
		const result = await db.execute(sql`
			UPDATE restaurant
			SET organization_id = ${firstOrgId}
			WHERE organization_id IS NULL;
		`);
		console.log(`Updated restaurants assigned to organization ${firstOrgId}`);

		// Step 4: Add foreign key constraint (if not exists)
		console.log('Step 4: Adding foreign key constraint...');
		await db.execute(sql`
			DO $$
			BEGIN
				IF NOT EXISTS (
					SELECT 1 FROM pg_constraint WHERE conname = 'restaurant_organization_id_fkey'
				) THEN
					ALTER TABLE restaurant
						ADD CONSTRAINT restaurant_organization_id_fkey
						FOREIGN KEY (organization_id)
						REFERENCES organization(id)
						ON DELETE CASCADE;
				END IF;
			END $$;
		`);

		// Step 5: Create index (if not exists)
		console.log('Step 5: Creating index...');
		await db.execute(sql`
			CREATE INDEX IF NOT EXISTS restaurant_organizationId_idx
			ON restaurant USING btree (organization_id text_ops);
		`);

		// Step 6: Make column NOT NULL
		console.log('Step 6: Making organization_id NOT NULL...');
		await db.execute(sql`
			ALTER TABLE restaurant ALTER COLUMN organization_id SET NOT NULL;
		`);

		console.log('✓ Migration completed successfully!');
		await client.end();
		process.exit(0);
	} catch (error) {
		console.error('✗ Migration failed:', error);
		await client.end();
		process.exit(1);
	}
}

migrate();

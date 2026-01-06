import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

const PG_HOST = process.env.PG_HOST || 'localhost';
const PG_PORT = process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432;
const PG_USER = process.env.PG_USER || 'postgres';
const PG_PASSWORD = process.env.PG_PASSWORD || 'password';
const PG_DATABASE = process.env.PG_DATABASE || 'streamizdat';

import { Pool } from 'pg';

const pool = new Pool({
    host: PG_HOST,
    port: PG_PORT,
    user: PG_USER,
    password: PG_PASSWORD,
    database: PG_DATABASE,
});

const db = drizzle(pool);

export default db;

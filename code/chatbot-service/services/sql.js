import pkg from "pg";
const { Client } = pkg;

export async function runSQL(query) {
  const client = new Client({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
  });

  await client.connect();
  const result = await client.query(query);
  await client.end();
  return result.rows;
}

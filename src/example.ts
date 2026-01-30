import { db } from "./db";
import { submissions } from "./schema";

async function main() {
  await db.insert(submissions).values({
    name: "Ada",
    email: "ada@example.com",
    designUrl: "https://example.com/my-cad"
  });

  const rows = await db.select().from(submissions);
  console.log(rows);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

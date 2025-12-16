import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"

export async function GET() {
  const schemaPath = path.join(process.cwd(), "supabase", "schema.sql")
  const sql = await fs.readFile(schemaPath, "utf8")
  return NextResponse.json({ sql })
}


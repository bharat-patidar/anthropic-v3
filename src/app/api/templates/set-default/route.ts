import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// Initialize database connection
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('No database URL found. Please set DATABASE_URL or POSTGRES_URL environment variable.');
}

const sql = databaseUrl ? postgres(databaseUrl, {
  ssl: 'require',
  max: 1,
}) : null;

// POST set a template as default
export async function POST(request: NextRequest) {
  try {
    if (!sql) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const body = await request.json();
    const { id, storageKey } = body;

    if (!id || !storageKey) {
      return NextResponse.json(
        { error: 'id and storageKey are required' },
        { status: 400 }
      );
    }

    // First, unset all defaults for this storage key
    await sql`
      UPDATE templates
      SET is_default = FALSE
      WHERE storage_key = ${storageKey}
    `;

    // Then set the specified template as default
    await sql`
      UPDATE templates
      SET is_default = TRUE
      WHERE id = ${id} AND storage_key = ${storageKey}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting default template:', error);
    return NextResponse.json(
      { error: 'Failed to set default template' },
      { status: 500 }
    );
  }
}

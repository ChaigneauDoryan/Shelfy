import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  if (!request.body) {
    return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
  }

  const fileBlob = await request.blob();

  try {
    const blob = await put(filename, fileBlob, {
      access: 'public',
      contentType: 'image/png',
      // You might want to add more options here, e.g., contentType
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error uploading avatar blob:', error);
    return NextResponse.json({ error: 'Failed to upload avatar file' }, { status: 500 });
  }
}

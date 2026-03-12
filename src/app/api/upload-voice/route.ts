import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER || 'voice-recordings';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_MIME_TYPES = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/mp4', 'audio/mpeg'];

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request & Get Form Data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'Missing file or userId' },
        { status: 400 }
      );
    }

    // 2. Validate File Size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File exceeds 3MB limit' },
        { status: 400 }
      );
    }

    // 3. Validate Mime Type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: webm, mp3, wav' },
        { status: 400 }
      );
    }

    // 4. Initialize Azure Storage Blob Client
    if (!accountName || !accountKey) {
      console.error('Azure Storage credentials missing in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Assuming container 'voice-recordings' already exists as per the user's prompt.

    // 5. Generate Unique Filename
    const timestamp = Date.now();
    // Default extension fallback if type parsing fails
    let ext = 'webm';
    if (file.type.includes('mpeg') || file.type.includes('mp3')) ext = 'mp3';
    if (file.type.includes('wav')) ext = 'wav';
    
    const blobName = `${userId}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // 6. Upload File Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: file.type }
    });

    // 7. Return Public URL
    return NextResponse.json({
      url: blockBlobClient.url,
      success: true
    });

  } catch (error: any) {
    console.error('Azure Upload Error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}

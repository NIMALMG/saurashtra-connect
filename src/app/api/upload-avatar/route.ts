import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_PROFILE || 'profile-images';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const userId = formData.get('userId') as string | null;
    const file = formData.get('file') as File | null;
    const imageUrl = formData.get('imageUrl') as string | null;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (!file && !imageUrl) {
      return NextResponse.json({ error: 'Either file or imageUrl must be provided' }, { status: 400 });
    }

    let buffer: Buffer;
    let contentType = 'image/jpeg';
    let fileExtension = 'jpg';

    // ─── Path 1: User uploaded a raw File payload
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File exceeds 2MB limit' }, { status: 400 });
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type. Allowed: jpeg, png, webp' }, { status: 400 });
      }

      contentType = file.type;
      fileExtension = file.name.split('.').pop() || 'jpg';
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } 
    // ─── Path 2: Intercepting a Google OAuth imageUrl
    else if (imageUrl) {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch external image');
      
      const externalBuffer = await response.arrayBuffer();
      buffer = Buffer.from(externalBuffer);
      
      const fetchedType = response.headers.get('content-type');
      if (fetchedType && ALLOWED_MIME_TYPES.includes(fetchedType)) {
        contentType = fetchedType;
        if (fetchedType.includes('png')) fileExtension = 'png';
        if (fetchedType.includes('webp')) fileExtension = 'webp';
      }
    }

    // ─── Initialize Azure ──────────────────────────────────────────────────
    if (!accountName || !accountKey) {
      console.error('Azure Storage credentials missing in environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Hardcode the file payload to identically overwrite the previous profile image
    const blobName = `${userId}.jpg`; 
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Delete existing blob explicitly to prevent caching visual artifacts
    await blockBlobClient.deleteIfExists();

    // Upload new buffer payload
    await blockBlobClient.uploadData(buffer!, {
      blobHTTPHeaders: { blobContentType: contentType }
    });

    // We attach a timestamp query param to uniquely cache-bust the frontend render
    const uniqueUrl = `${blockBlobClient.url}?t=${Date.now()}`;

    return NextResponse.json({
      url: uniqueUrl,
      success: true
    });

  } catch (error: any) {
    console.error('Azure Upload Error:', error);
    return NextResponse.json(
      { error: 'Avatar upload failed', details: error.message },
      { status: 500 }
    );
  }
}

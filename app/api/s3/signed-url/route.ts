import { deleteFile, uploadAsset, getSignedDownloadUrl, getPresignedUploadUrl } from '@/lib/s3';
import { NextResponse } from 'next/server';

/**
 * S3/R2 Signed URL API
 * Handles generating secure, temporary URLs for reading/viewing assets.
 */

// Generate signed DOWNLOAD/VIEW URL(s)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const pathsParam = searchParams.get('paths');
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600');

    if (!path && !pathsParam) {
      return NextResponse.json({ error: 'Missing path or paths parameter' }, { status: 400 });
    }

    if (pathsParam) {
      const paths = pathsParam.split(',').filter(Boolean);
      const urls = await Promise.all(
        paths.map(async (p) => ({
          path: p,
          signedUrl: await getSignedDownloadUrl(p, expiresIn),
        }))
      );
      return NextResponse.json({ urls });
    }

    const signedUrl = await getSignedDownloadUrl(path!, expiresIn);
    return NextResponse.json({ signedUrl });
  } catch (error) {
    console.error('Error generating signed download URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Generate batch signed DOWNLOAD URL(s) via PATCH (for large lists)
export async function PATCH(request: Request) {
  try {
    const { paths, expiresIn = 3600 } = await request.json();

    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid paths array' }, { status: 400 });
    }

    const urls = await Promise.all(
      paths.map(async (p) => ({
        path: p,
        signedUrl: await getSignedDownloadUrl(p, expiresIn),
      }))
    );

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Error generating batch signed download URLs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

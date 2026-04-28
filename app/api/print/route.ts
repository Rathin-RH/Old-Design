import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PI_BASE_URL = (process.env.PI_BASE_URL || 'http://10.72.10.61:8000').replace(/\/+$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentUrl, printSettings, jobId, fileName } = body ?? {};

    if (!documentUrl) {
      return NextResponse.json(
        { success: false, error: 'Document URL is required' },
        { status: 400 }
      );
    } //comment

    // 1) Download the document server-side
    const fileResponse = await fetch(documentUrl, {
      cache: 'no-store',
    });

    if (!fileResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to download document: ${fileResponse.status} ${fileResponse.statusText}`,
        },
        { status: 502 }
      );
    }

    const blob = await fileResponse.blob();

    // Try to preserve filename and extension
    const inferredName =
      fileName ||
      documentUrl.split('/').pop()?.split('?')[0] ||
      `print-job-${jobId || Date.now()}.pdf`;

    const normalizedFileName = inferredName.includes('.')
      ? inferredName
      : `${inferredName}.pdf`;

    // 2) Build Pi-compatible multipart form
    const formData = new FormData();
    formData.append('file', blob, normalizedFileName);
    formData.append(
      'settings',
      JSON.stringify({
        copies: Number(printSettings?.copies ?? 1),
        orientation: printSettings?.orientation ?? 'portrait',
        color: Boolean(printSettings?.color ?? false),
        duplex: Boolean(printSettings?.duplex ?? false),
        paperSize: printSettings?.paperSize ?? 'A4',
        ...(printSettings?.pages ? { pages: printSettings.pages } : {}),
      })
    );

    // 3) Forward to Raspberry Pi print server
    const piResponse = await fetch(`${PI_BASE_URL}/print`, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'VPrintKiosk/1.0',
      },
    });

    const contentType = piResponse.headers.get('content-type') || '';

    let piData: any = null;
    if (contentType.includes('application/json')) {
      piData = await piResponse.json();
    } else {
      piData = await piResponse.text();
    }

    if (!piResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            typeof piData === 'string'
              ? piData
              : piData?.detail || piData?.error || 'Pi print server error',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Print job queued on Raspberry Pi',
      jobId,
      cupsJobId: piData?.job_id,
      printer: piData?.printer,
      totalPages: piData?.total_pages ?? null,
      method: 'pi-print-proxy',
      raw: piData,
    });
  } catch (error: any) {
    console.error('Print API proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unexpected print proxy error',
      },
      { status: 500 }
    );
  }
}
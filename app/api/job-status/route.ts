import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PI_BASE_URL = (process.env.PI_BASE_URL || 'http://10.72.10.61:8000').replace(/\/+$/, '');

export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId is required' },
        { status: 400 }
      );
    }

    const res = await fetch(`${PI_BASE_URL}/jobs/${encodeURIComponent(jobId)}`, {
      cache: 'no-store',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'VPrintKiosk/1.0',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Pi responded with ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}

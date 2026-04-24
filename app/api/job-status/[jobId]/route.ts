import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PI_BASE_URL = 'http://10.72.10.61:8000';

type Context = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { jobId } = await context.params;

    const res = await fetch(`${PI_BASE_URL}/jobs/${jobId}`, {
      cache: 'no-store',
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
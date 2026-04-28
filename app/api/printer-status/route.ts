import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PI_BASE_URL = process.env.PI_BASE_URL || 'http://10.72.10.61:8000';
const PRINTER_NAME = 'Brother_HL_L5210DN_series';

export async function GET() {
  try {
    const res = await fetch(
      `${PI_BASE_URL}/printers/${encodeURIComponent(PRINTER_NAME)}/status`,
      {
        cache: 'no-store',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'VPrintKiosk/1.0',
        },
      }
    );

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
      { success: false, error: error?.message || 'Failed to fetch printer status' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google/calendar';

export async function GET() {
  // Redirigir al usuario a la página de consentimiento de Google
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}

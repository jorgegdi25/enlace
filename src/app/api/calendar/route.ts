import { NextResponse } from 'next/server';
import { getCalendarClient } from '@/lib/google/calendar';

export async function GET() {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!refreshToken) {
    return NextResponse.json({ error: 'Google Calendar no está configurado' }, { status: 400 });
  }

  try {
    const calendar = getCalendarClient(refreshToken);
    
    // Obtener los próximos 10 eventos desde ahora
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items || [];
    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

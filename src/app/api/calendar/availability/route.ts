import { NextResponse } from 'next/server';
import { getCalendarClient } from '@/lib/google/calendar';

export async function GET() {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) return NextResponse.json({ error: 'No config' }, { status: 400 });

  try {
    const calendar = getCalendarClient(refreshToken);
    
    // Rango: desde ahora hasta dentro de 14 días
    const timeMin = new Date().toISOString();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 14);

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const busySlots = res.data.items || [];
    
    // Lógica simple de disponibilidad: 
    // Buscamos bloques de 1 hora
    const availableSlots = [];
    let current = new Date();
    current.setMinutes(0, 0, 0);
    current.setHours(current.getHours() + 1); // Empezar en la siguiente hora

    while (current < timeMax) {
      const hour = current.getHours();
      
      // Bloque 1: 8 AM a 10 AM (hour >= 8 && hour < 10)
      // Bloque 2: 4 PM a 6 PM (hour >= 16 && hour < 18)
      const isInMorningWindow = (hour >= 8 && hour < 10);
      const isInAfternoonWindow = (hour >= 16 && hour < 18);

      // Solo días laborales (Lunes a Viernes)
      if ((isInMorningWindow || isInAfternoonWindow) && current.getDay() !== 0 && current.getDay() !== 6) {
        const slotEnd = new Date(current.getTime() + 60 * 60 * 1000);
        
        // Verificar si este bloque choca con algo "ocupado"
        const isBusy = busySlots.some(event => {
          const eventStart = new Date(event.start?.dateTime || event.start?.date || 0);
          const eventEnd = new Date(event.end?.dateTime || event.end?.date || 0);
          return (current < eventEnd && slotEnd > eventStart);
        });

        if (!isBusy) {
          availableSlots.push(new Date(current));
        }
      }
      
      current.setTime(current.getTime() + 60 * 60 * 1000); // Avanzar 1 hora
    }

    return NextResponse.json({ 
      success: true, 
      slots: availableSlots.map(d => ({
        display: d.toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
        iso: d.toISOString()
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

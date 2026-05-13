import { getCalendarClient } from '@/lib/google/calendar';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { leadId, slotIso } = await req.json();

    if (!leadId || !slotIso) {
      return new Response(JSON.stringify({ error: 'Missing leadId or slotIso' }), { status: 400 });
    }

    // 1. Obtener los datos del Lead desde Supabase
    const { data: lead, error: leadError } = await adminSupabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      console.error("Lead fetch error:", leadError);
      return new Response(JSON.stringify({ error: 'Lead not found' }), { status: 404 });
    }

    const email = lead.email || (lead.metadata && lead.metadata.email);
    const name = lead.name || 'Cliente';
    const phone = lead.phone || 'Sin WhatsApp';

    if (!email) {
      return new Response(JSON.stringify({ error: 'Lead has no email, cannot send calendar invite' }), { status: 400 });
    }

    // 2. Configurar el cliente de Google Calendar
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (!refreshToken) {
      return new Response(JSON.stringify({ error: 'Google Refresh Token missing in env' }), { status: 500 });
    }
    
    const calendar = getCalendarClient(refreshToken);

    // 3. Crear el evento
    const startTime = new Date(slotIso);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hora de duración

    const event = {
      summary: `🚀 Auditoría Digital ENLACE - ${name}`,
      description: `Hola ${name},\n\nSe ha programado tu sesión de Auditoría Digital con el equipo de ENLACE.\n\n**DETALLES DE LA SESIÓN:**\n- **Empresa:** ${lead.company || 'No especificada'}\n- **Objetivo:** Analizar arquitectura digital y optimización de ventas.\n- **Plataforma:** Google Meet (Enlace adjunto en esta invitación).\n\n**RECOMENDACIONES:**\n1. Asegúrate de estar en un lugar tranquilo y con buena conexión.\n2. Ten a la mano tus dudas sobre el proceso comercial actual.\n\n¡Nos vemos pronto!`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/Bogota', 
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/Bogota',
      },
      attendees: [
        { email: email }
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${leadId}-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1, // Obligatorio para generar enlace de Meet
      sendUpdates: 'all', // Obligatorio para que Google le envíe el correo de invitación al asistente
    });

    // 4. Actualizar el estado del lead a agendado
    await adminSupabase
      .from('leads')
      .update({ 
        status: 'contactado', 
        notes: lead.notes + `\n\nCita agendada para: ${startTime.toLocaleString()}` 
      })
      .eq('id', leadId);

    return new Response(JSON.stringify({ success: true, eventLink: response.data.htmlLink }), { status: 200 });

  } catch (error: any) {
    console.error('Error scheduling event:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}

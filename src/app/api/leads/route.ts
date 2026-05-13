import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente público (anon) — solo puede INSERT gracias a las políticas RLS
const anonSupabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente administrativo (service_role) — bypassa RLS para operaciones del servidor
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

// Extrae datos estructurados del historial de chat usando heurísticas
function extractStructuredData(history: { role: string; content: string }[]) {
  const userMessages = history.filter((m) => m.role === 'user');
  const allUserText = userMessages.map((m) => m.content).join(' ');

  // Ignorar el mensaje inicial automático si existe
  const realUserMessages = userMessages.filter(m => m.content !== "Hola, quiero empezar el análisis de mi negocio digital.");
  
  // Extraer nombre - típicamente en el primer mensaje real
  let name = '';
  if (realUserMessages.length > 0) {
    const firstMsg = realUserMessages[0].content;
    const explicit = firstMsg.match(/(?:me llamo|mi nombre es|soy)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){0,3})/i);
    if (explicit) { 
      name = explicit[1].trim(); 
    } else {
      // Tomar las primeras palabras del primer mensaje, asumiendo que respondió directo con su nombre
      const words = firstMsg.split(/[\s,.]+/).filter(Boolean);
      if (words.length <= 4 && !firstMsg.match(/\d/)) {
        name = words.join(' ');
      } else {
        name = words.slice(0, 2).join(' '); // Mejor intento: primeras dos palabras
      }
    }
    // Remover menciones de ciudad del nombre
    name = name.replace(/\b(?:de|desde|en)\b.*$/i, '').trim();
  }

  // Extraer teléfono/WhatsApp
  let phone = '';
  const phoneMatch = allUserText.match(/(\+?\d[\d\s\-]{7,14}\d)/);
  if (phoneMatch) phone = phoneMatch[1].replace(/[\s\-]/g, '');

  // Extraer empresa/negocio del contexto (suele ser el tercer mensaje)
  let company = '';
  if (realUserMessages.length >= 3) {
    company = realUserMessages[2].content.substring(0, 80);
  } else if (realUserMessages.length >= 2 && !/\d/.test(realUserMessages[1].content)) {
    company = realUserMessages[1].content.substring(0, 80);
  }

  // Extraer necesidades - resumen de los mensajes del usuario
  const needs = userMessages
    .slice(0, 4)
    .map((m) => m.content)
    .join(' | ')
    .substring(0, 200);

  // Extraer ciudad (heurística simple)
  let city = '';
  const cities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cucuta', 'Bucaramanga', 'Pereira'];
  for (const c of cities) {
    if (allUserText.toLowerCase().includes(c.toLowerCase())) {
      city = c;
      break;
    }
  }

  // Extraer email
  let email = '';
  const emailMatch = allUserText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) email = emailMatch[0];

  // Extraer enlaces (URLs)
  const links = allUserText.match(/https?:\/\/[^\s]+/g) || [];

  // Extraer Score de Madurez (del asistente)
  let score: number | null = null;
  const assistantMsgs = history.filter(m => m.role === 'assistant');
  for (const msg of [...assistantMsgs].reverse()) {
    const scoreMatch = msg.content.match(/Score de Madurez Digital.*(\d+)\/10/i) || msg.content.match(/Score.*:?\s*(\d+)/i);
    if (scoreMatch) {
      score = parseInt(scoreMatch[1]);
      break;
    }
  }

  return { name, phone, company, needs, city, email, links, score };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    let name = body.name || '';
    let phone = body.phone || '';
    const updates: any = { ...body };
    delete updates.id;

    // Si viene historial, intentar extraer datos y actualizar estado
    let extracted: any = {};
    if (body.history && body.history.length > 0) {
      extracted = extractStructuredData(body.history);
      if (extracted.name) updates.name = extracted.name;
      if (extracted.phone) updates.phone = extracted.phone;
      if (extracted.company) updates.company = extracted.company;
      if (extracted.needs) updates.needs = extracted.needs;
      
      // Si ahora tenemos nombre o teléfono, el estado pasa a 'nuevo' si estaba 'incompleto'
      // Pero solo si no se pasó un status explícito (para no sobreescribir 'cerrado', etc.)
      if (!body.status && (extracted.name || extracted.phone)) {
        // Consultar estado actual primero o simplemente asumir que si hay datos es 'nuevo'
        // Para simplificar: si hay datos y no se envió status, poner 'nuevo'
        updates.status = 'nuevo';
      }
    }

    // Determinar estado inicial (Prioridad máxima a sesión agendada)
    let status = 'incompleto';
    const hasInfo = !!(updates.name || name || updates.phone || phone || extracted.city || body.city || extracted.email || body.email);
    const hasScheduled = body.history?.some((m: any) => m.content.includes('[CONTACTO_CAPTURADO]'));
    
    if (hasScheduled) {
      status = 'sesion';
    } else if (hasInfo || body.isManual) {
      status = 'nuevo';
    }

    const { data, error } = await anonSupabase
      .from('leads')
      .insert([
        {
          history: body.history || [],
          name: updates.name || name || '',
          phone: updates.phone || phone || '',
          company: updates.company || body.company || '',
          needs: updates.needs || body.needs || '',
          status,
          notes: body.notes || '',
          email: updates.email || body.email || extracted.email || '',
          city: updates.city || body.city || extracted.city || '',
          score: updates.score || body.score || extracted.score || null,
          links: updates.links || body.links || extracted.links || [],
          metadata: {
            timestamp: body.timestamp || new Date().toISOString(),
            user_agent: req.headers.get('user-agent'),
            isManual: body.isManual || false,
            email: updates.email || body.email || '',
            links: extracted.links || [],
            ...body.metadata
          },
        },
      ])
      .select();

    if (error) {
      console.error('Error inserting into Supabase:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

// PATCH - Actualizar status, notas, etc. de un lead existente
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, history, ...restUpdates } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    }

    // Obtener lead actual para poder mezclar metadata
    const { data: currentLead, error: fetchError } = await adminSupabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentLead) {
      return new Response(JSON.stringify({ error: 'Lead no encontrado' }), { status: 404 });
    }

    const updates: any = { ...restUpdates };

    if (history) {
      updates.history = history;
      const extracted = extractStructuredData(history);
      
      if (extracted.name) updates.name = extracted.name;
      if (extracted.phone) updates.phone = extracted.phone;
      if (extracted.company) updates.company = extracted.company;
      if (extracted.needs) updates.needs = extracted.needs;
      if (extracted.email) updates.email = extracted.email;
      if (extracted.city) updates.city = extracted.city;
      if (extracted.score) updates.score = extracted.score;
      if (extracted.links) updates.links = extracted.links;
      
      const newMetadata = { ...(currentLead.metadata || {}) };
      if (extracted.email) {
        newMetadata.email = extracted.email;
      }
      if (extracted.links && extracted.links.length > 0) {
        newMetadata.links = extracted.links;
      }
      updates.metadata = newMetadata;

      // Lógica de estados inteligente
      const hasScheduledInHistory = history.some((m: any) => m.content.includes('[CONTACTO_CAPTURADO]'));
      
      // Si agendó sesión, forzar estado 'sesion' (a menos que sea un estado final)
      if (hasScheduledInHistory && !['cerrado', 'perdido', 'contactado'].includes(currentLead.status)) {
        updates.status = 'sesion';
      } 
      // Si no agendó pero tiene info y era incompleto, pasar a 'nuevo'
      else if (!updates.status && (extracted.name || extracted.phone || extracted.email || extracted.city)) {
        if (currentLead.status === 'incompleto') {
          updates.status = 'nuevo';
        }
      }
    }

    const { data, error } = await adminSupabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating lead:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

// DELETE - Eliminar un lead
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    }

    const { error } = await adminSupabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lead:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

// GET - Obtener todos los leads
export async function GET() {
  try {
    const { data, error } = await adminSupabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}


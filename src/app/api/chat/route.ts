export const maxDuration = 30;

const SYSTEM_PROMPT = `Eres el "Director de Estrategia Digital" de la agencia ENLACE. Tu objetivo es pre-calificar dueños de negocio mediante una conversación fluida, profesional y altamente persuasiva, y finalmente agendar una auditoría.

REGLAS DE ORO:
- NO actúes como un robot de encuestas. NUNCA des opciones numeradas (1, 2, 3).
- Haz preguntas abiertas pero dirigidas.
- Escribe mensajes MUY CORTOS (máximo 2-3 oraciones).
- Muestra autoridad, usa lenguaje premium (ej: "ecosistema digital", "cuello de botella", "escalar").
- Escucha la respuesta del usuario y utilízala en tu siguiente mensaje para mostrar empatía y análisis real.

FLUJO DE CONSULTORÍA (1 paso a la vez):

Paso 0 - SALUDO:
"Hola 👋 Soy el Estratega IA de Enlace. En menos de 2 minutos analizaremos qué está frenando tus ventas en internet. Para empezar, ¿cuál es tu nombre y desde qué ciudad nos escribes?"

Paso 1 - TELÉFONO:
"Mucho gusto, [nombre]. ¿Cuál es tu número de WhatsApp para enviarte el resultado de este diagnóstico?"

Paso 2 - DESCUBRIMIENTO:
"Perfecto. Cuéntame de forma breve: ¿Qué vende tu negocio y a quién se lo vendes?"

Paso 3 - CONTEXTO DIGITAL Y LINKS:
"Entendido. Para analizar tu situación actual, por favor **pega aquí los links** de tu página web y tus redes sociales (Instagram, Facebook, etc.). Si no tienes, solo dime 'no tengo'."

Paso 4 - EL PROBLEMA:
"Gracias. El último paso: ¿Cuál es el mayor problema que tienes hoy para conseguir clientes? (Ejemplo: 'No tengo prospectos', 'Llegan pero no compran', 'No sé cómo vender por internet')."

Paso 5 - IA MICRO-DIAGNÓSTICO & SCORE:
(Analiza profundamente su respuesta y sus links si los dio). 
1. Genera un análisis de autoridad detectando su principal cuello de botella.
2. Asígnale un "Score de Madurez Digital" del 1 al 10. Ejemplo: "Tu negocio tiene un nivel de madurez digital de 4/10."
3. Explica brevemente por qué y cómo ENLACE construye ecosistemas (no solo herramientas) que resuelven esto.

Paso 6 - LA OFERTA:
"Para que un Estratega Directivo revise esto en detalle y te muestre la solución exacta, te ofrezco una Sesión de Arquitectura Digital de 15 min (sin costo). ¿A qué correo te envío la invitación al calendario?"

Paso 7 - CONFIRMACIÓN FINAL (OBLIGATORIO):
Cuando el usuario te dé su correo electrónico, debes dar por terminada la conversación. 
Tu respuesta DEBE incluir exactamente la etiqueta [CONTACTO_CAPTURADO] al final del mensaje. Sin esta etiqueta, el sistema no podrá mostrar la agenda.
Ejemplo: "Perfecto. En segundos verás nuestros horarios disponibles abajo. Elige el que mejor te quede y te llegará la invitación. ¡Hablemos pronto! [CONTACTO_CAPTURADO]"`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: ChatMessage[] };

  const openaiMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text();
    console.error("OpenAI API error:", errText);
    return new Response(JSON.stringify({ error: errText }), { status: 500 });
  }

  // Stream SSE from OpenAI back as plain text
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Guarda la línea incompleta para el siguiente chunk

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const text = parsed?.choices?.[0]?.delta?.content;
                if (text) {
                  controller.enqueue(encoder.encode(text));
                }
              } catch (e) {
                // skip malformed
              }
            }
          }
        }
      } catch (err) {
        console.error("Stream error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}

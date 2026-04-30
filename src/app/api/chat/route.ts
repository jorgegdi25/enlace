export const maxDuration = 30;

const SYSTEM_PROMPT = `Eres el "Agente ENLACE", un asesor de inteligencia digital de la agencia ENLACE Digital Intelligence. Tu rol es hacer un diagnóstico conversacional y profesional a un prospecto de negocio.

FLUJO DE CONVERSACIÓN OBLIGATORIO (sigue este orden exacto):

1. BIENVENIDA: Preséntate brevemente y haz la primera pregunta sobre el tipo de negocio.

2. PREGUNTA 1 — TIPO DE NEGOCIO: Pregunta qué tipo de negocio tiene. Espera la respuesta.

3. PREGUNTA 2 — PROBLEMA PRINCIPAL: Según la respuesta anterior, pregunta cuál es su mayor reto actual para conseguir clientes. Ofrece 3 opciones numeradas relevantes a su negocio + opción "Otro".

4. PREGUNTA 3 — SITUACIÓN DIGITAL: Pregunta cómo es su presencia digital hoy. Ofrece opciones: (1) No tengo ninguna presencia digital, (2) Solo tengo redes sociales, (3) Tengo página web pero no genera clientes, (4) Tengo algo de tráfico pero no convierte.

5. PREGUNTA 4 — INVERSIÓN PREVIA: Pregunta si han invertido antes en marketing digital o publicidad. Opciones: (1) Sí, pero no tuve buenos resultados, (2) Sí y me fue bien, (3) Nunca he invertido en publicidad paga.

6. PREGUNTA 5 — META: Pregunta cuántos clientes nuevos al mes quisiera generar de forma consistente. Ofrece rangos: (1) 5-10, (2) 10-25, (3) 25-50, (4) +50.

7. CAPTURA PARA CITA: Una vez respondidas las 5 preguntas, di: "Con base en tus respuestas, veo un potencial enorme para [menciona un insight rápido]. Calificas para una sesión estratégica gratuita de 15 minutos con uno de nuestros especialistas para diseñar tu hoja de ruta. ¿Cuál es tu nombre y tu número de WhatsApp para coordinar?"

8. CIERRE: Al recibir los datos, agradece y confirma que le escribirán por WhatsApp en menos de 24 horas. Termina con: "¡Excelente! Hablamos pronto por WhatsApp. [CONTACTO_CAPTURADO]"

REGLAS DE COMPORTAMIENTO:
- Sé profesional pero cercano, NO robótico
- Respuestas cortas y directas (máximo 3-4 líneas)
- Siempre espera la respuesta antes de avanzar al siguiente paso
- Usa SOLO el idioma español
- NO ofrezcas precios ni garantías específicas
- Si el usuario pregunta algo fuera del flujo, responde brevemente y retoma el diagnóstico
- El insight del paso 6 debe ser genuinamente útil y específico según sus respuestas`;

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

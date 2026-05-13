import { NextResponse } from 'next/server';
import { getTokens } from '@/lib/google/calendar';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No se recibió el código de autorización' }, { status: 400 });
  }

  try {
    const tokens = await getTokens(code);
    
    // Mostramos el refresh_token para que el usuario lo guarde en .env.local
    // En una app real, esto se guardaría en una base de datos de configuración
    return new Response(`
      <html>
        <body style="font-family: sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
          <div style="background: #1e293b; padding: 2rem; border-radius: 1rem; border: 1px solid #334155; max-width: 600px; text-align: center;">
            <h1 style="color: #f97316;">¡Conexión Exitosa!</h1>
            <p>Copia el siguiente código (Refresh Token) y pégalo en tu archivo <b>.env.local</b>:</p>
            <code style="background: #0f172a; padding: 1rem; display: block; border-radius: 0.5rem; word-break: break-all; margin: 1rem 0; border: 1px solid #f97316;">
              GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
            </code>
            <p style="font-size: 0.8rem; color: #94a3b8;">Una vez guardado, reinicia el servidor y el CRM tendrá acceso permanente a tu calendario.</p>
            <a href="/admin" style="background: #f97316; color: white; padding: 0.8rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 1rem;">Volver al Admin</a>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  } catch (error: any) {
    console.error('Error en callback de Google:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const lead = await req.json();
    const filePath = join(process.cwd(), 'leads.json');
    
    let leads = [];
    try {
      const data = await readFile(filePath, 'utf8');
      leads = JSON.parse(data);
    } catch (e) {
      // Si el archivo no existe, empezamos con array vacío
    }

    const newLead = {
      ...lead,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };

    leads.push(newLead);
    await writeFile(filePath, JSON.stringify(leads, null, 2));

    // OPCIONAL: Aquí es donde enviarías a Make/Zapier para Google Sheets
    // await fetch('TU_WEBHOOK_URL', { method: 'POST', body: JSON.stringify(newLead) });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error saving lead' }), { status: 500 });
  }
}

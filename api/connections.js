import { db } from '../lib/supabase.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await db('/xero_connections?select=id,clinic_name,tenant_id,tenant_name,updated_at&order=clinic_name');
      return res.json(rows || []);
    }
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });
      await db(`/xero_connections?id=eq.${id}`, { method: 'DELETE' });
      return res.json({ ok: true });
    }
    res.status(405).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

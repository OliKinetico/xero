import { db } from '../lib/supabase.js';
import { getTokens, xeroGet } from '../lib/xero.js';

function dateRange(period) {
  const now = new Date();
  const toDate = now.toISOString().split('T')[0];
  if (period === 'ltm') {
    const from = new Date(now);
    from.setFullYear(from.getFullYear() - 1);
    return { fromDate: from.toISOString().split('T')[0], toDate };
  }
  return { fromDate: `${now.getFullYear()}-01-01`, toDate };
}

function extractSummary(rows) {
  let income = 0, netProfit = null;
  for (const section of rows) {
    if (section.RowType !== 'Section') continue;
    for (const row of (section.Rows || [])) {
      if (row.RowType !== 'SummaryRow') continue;
      const label = row.Cells?.[0]?.Value || '';
      const val = parseFloat(row.Cells?.[1]?.Value || '0');
      if (section.Title === 'Income') income = val;
      if (/net (profit|loss)/i.test(label)) netProfit = val;
    }
  }
  return { income, netProfit: netProfit ?? income };
}

export default async function handler(req, res) {
  try {
    const { period = 'cy', tenantId } = req.query;
    const { fromDate, toDate } = dateRange(period);

    let query = '/xero_connections?select=*&order=clinic_name';
    if (tenantId && tenantId !== 'all') query += `&tenant_id=eq.${tenantId}`;

    const connections = await db(query);

    const results = await Promise.all((connections || []).map(async conn => {
      try {
        const { accessToken, newRefreshToken } = await getTokens(conn.refresh_token);
        await db(`/xero_connections?tenant_id=eq.${conn.tenant_id}`, {
          method: 'PATCH',
          body: { refresh_token: newRefreshToken, updated_at: new Date().toISOString() }
        });
        const data = await xeroGet(
          `/Reports/ProfitAndLoss?fromDate=${fromDate}&toDate=${toDate}`,
          accessToken,
          conn.tenant_id
        );
        const rows = data?.Reports?.[0]?.Rows || [];
        const summary = extractSummary(rows);
        return { clinic: conn.clinic_name, tenantId: conn.tenant_id, summary, rows, error: null };
      } catch (err) {
        return { clinic: conn.clinic_name, tenantId: conn.tenant_id, summary: null, rows: [], error: err.message };
      }
    }));

    res.json({ results, fromDate, toDate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

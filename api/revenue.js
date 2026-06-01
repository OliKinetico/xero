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

function extractIncome(rows) {
  for (const section of rows) {
    if (section.RowType === 'Section' && section.Title === 'Income') {
      const summary = section.Rows?.find(r => r.RowType === 'SummaryRow');
      return parseFloat(summary?.Cells?.[1]?.Value || '0');
    }
  }
  return 0;
}

export default async function handler(req, res) {
  try {
    const { period = 'ytd' } = req.query;
    const { fromDate, toDate } = dateRange(period);
    const connections = await db('/xero_connections?select=*&order=clinic_name');

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
        const income = extractIncome(data?.Reports?.[0]?.Rows || []);
        return { clinic: conn.clinic_name, income, error: null };
      } catch (err) {
        return { clinic: conn.clinic_name, income: 0, error: err.message };
      }
    }));

    const total = results.reduce((sum, r) => sum + r.income, 0);
    res.json({ results, total, fromDate, toDate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

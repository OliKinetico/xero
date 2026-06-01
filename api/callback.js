import { db } from '../lib/supabase.js';

const CLIENT_ID = 'A1C337E4F974482E8126CA1FCFDFEC67';
const REDIRECT_URI = 'https://xero-olikineticos-projects.vercel.app/api/callback';

const CLINIC_ORG_MAP = {
  'Waldegrave': 'Waldegrave Clinic Ltd',
  'Good Health Centre': 'Good Health Centre Ltd',
  'Vanbrugh': 'Vanbrugh Physiotherapy Limited',
  'Dynamic': 'Dynamic Chiropractic LTD',
  'reCentre Health': 'reCentre Health Limited',
  'Surrey Foot': 'Surrey Foot Service Ltd'
};

export default async function handler(req, res) {
  const { code, error, state } = req.query;
  if (error) return res.redirect(`/account.html?error=${encodeURIComponent(error)}`);
  if (!code) return res.redirect('/account.html?error=no_code');

  let clinic = '';
  try {
    clinic = JSON.parse(Buffer.from(state, 'base64url').toString()).clinic || '';
  } catch {}

  try {
    const tokenRes = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI })
    });
    const tokens = await tokenRes.json();
    if (tokens.error) return res.redirect(`/account.html?error=${encodeURIComponent(tokens.error)}`);

    const connRes = await fetch('https://api.xero.com/connections', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}`, 'Accept': 'application/json' }
    });
    const xeroConns = await connRes.json();
    if (!xeroConns?.length) return res.redirect('/account.html?error=no_tenant');

    const expectedOrgName = CLINIC_ORG_MAP[clinic];
    const tenant = xeroConns.find(c => c.tenantName === expectedOrgName) || xeroConns[0];

    await db('/xero_connections?on_conflict=tenant_id', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: {
        clinic_name: clinic || tenant.tenantName,
        tenant_id: tenant.tenantId,
        tenant_name: tenant.tenantName,
        refresh_token: tokens.refresh_token,
        updated_at: new Date().toISOString()
      }
    });

    res.redirect('/account.html?connected=' + encodeURIComponent(clinic || tenant.tenantName));
  } catch (err) {
    console.error('Callback error:', err);
    res.redirect('/account.html?error=token_exchange_failed');
  }
}

export default function handler(req, res) {
  const clinic = (req.query.clinic || '').trim();
  const state = Buffer.from(JSON.stringify({
    nonce: Math.random().toString(36).slice(2),
    clinic
  })).toString('base64url');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: 'A1C337E4F974482E8126CA1FCFDFEC67',
    redirect_uri: 'https://xero-olikineticos-projects.vercel.app/api/callback',
    scope: 'openid profile email accounting.reports.read accounting.transactions.read offline_access',
    state
  });

  res.redirect(`https://login.xero.com/identity/connect/authorize?${params}`);
}

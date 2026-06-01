export default function handler(req, res) {
  const clinic = (req.query.clinic || '').trim();
  const state = Buffer.from(JSON.stringify({
    nonce: Math.random().toString(36).slice(2),
    clinic
  })).toString('base64url');

  const clientId = 'A1C337E4F974482E8126CA1FCFDFEC67';
  const redirectUri = 'https://xero-olikineticos-projects.vercel.app/api/callback';
  const scope = 'openid profile email accounting.transactions.read accounting.contacts.read accounting.settings.read offline_access';

  const authUrl = 'https://login.xero.com/identity/connect/authorize' +
    '?response_type=code' +
    '&client_id=' + clientId +
    '&redirect_uri=' + encodeURIComponent(redirectUri) +
    '&scope=' + encodeURIComponent(scope) +
    '&state=' + encodeURIComponent(state);

  res.redirect(authUrl);
}

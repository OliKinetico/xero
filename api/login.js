export default function handler(req, res) {
    const clientId = 'A1C337E4F974482E8126CA1FCFDFEC67';
    const redirectUri = 'https://xero-olikineticos-projects.vercel.app/api/callback';
    const scope = 'openid profile email accounting.transactions.read accounting.contacts.read accounting.settings.read offline_access';
    const state = Math.random().toString(36).substring(2);

  const authUrl = `https://login.xero.com/identity/connect/authorize?` +
        `response_type=code` +
        `&client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&state=${state}`;

  res.redirect(authUrl);
}

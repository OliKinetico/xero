export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.redirect('/?error=' + error);
  }

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  const clientId = 'A1C337E4F974482E8126CA1FCFDFEC67';
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  const redirectUri = 'https://xero-olikineticos-projects.vercel.app/api/callback';

  try {
    const tokenRes = await fetch('https://identity.xero.com/connect/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              redirect_uri: redirectUri
      })
      });

    const tokens = await tokenRes.json();

    if (tokens.error) {
      return res.redirect('/?error=' + tokens.error);
    }

    // Store token in a cookie and redirect to dashboard
    res.setHeader('Set-Cookie', `xero_token=${tokens.access_token}; Path=/; HttpOnly; Secure; Max-Age=1800`);
    res.redirect('/dashboard.html');
  } catch (err) {
    res.redirect('/?error=token_exchange_failed');
  }
}

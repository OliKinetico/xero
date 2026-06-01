const CLIENT_ID = 'A1C337E4F974482E8126CA1FCFDFEC67';

export async function getTokens(storedRefreshToken) {
  const res = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`).toString('base64')
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: storedRefreshToken })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return { accessToken: data.access_token, newRefreshToken: data.refresh_token };
}

export async function xeroGet(path, accessToken, tenantId) {
  const res = await fetch(`https://api.xero.com/api.xro/2.0${path}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'xero-tenant-id': tenantId,
      'Accept': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`Xero ${res.status}: ${path}`);
  return res.json();
}

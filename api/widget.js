export default async function handler(req, res) {
  // 1) Tillåt iframe/CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const id = req.query.id;
  if (!id) {
    res.status(400).end('<p>Inget auktion-ID angivet.</p>');
    return;
  }

  try {
    // 2) Bygg URL för din egen tradera-proxy
    const host = req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const apiUrl = `${proto}://${host}/api/tradera?id=${encodeURIComponent(id)}`;

    // 3) Hämta JSON från /api/tradera
    const apiRes = await fetch(apiUrl);
    const data = await apiRes.json();

    if (!apiRes.ok || data.error) {
      throw new Error(data.error || 'Hämtning fel');
    }

    // 4) Extrahera och formatera
    const price = data.currentPrice ?? '–';
    const bids  = data.numberOfBids ?? '–';
    const end   = data.endTime
      ? new Date(data.endTime).toLocaleString('sv-SE')
      : '–';

    // 5) Skicka tillbaka enkel HTML-widget
    res.status(200).end(`
      <style>
        .tradera-widget { 
          font-family: sans-serif; 
          padding: 0.8em; 
          border: 1px solid #ddd; 
          border-radius: 4px; 
          background: #f9f9f9;
        }
        .tradera-widget p { margin: 0.4em 0; font-size: 14px; }
      </style>
      <div class="tradera-widget">
        <p><strong>Ledande bud:</strong> ${price} kr</p>
        <p><strong>Antal bud:</strong> ${bids} st</p>
        <p><strong>Slutar:</strong> ${end}</p>
      </div>
    `);

  } catch (err) {
    console.error('Widget error:', err);
    res.status(500).end('<p>Misslyckades hämta auktionsinfo.</p>');
  }
}

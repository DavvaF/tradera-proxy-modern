import { soap } from 'strong-soap';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const id = req.query.id;
  if (!id) {
    res.status(400).end('<p>Inget auktion-ID angivet.</p>');
    return;
  }

  // Hämta data från Tradera via din befintliga tradera.js-logik
  try {
    // Skapa SOAP-client
    const wsdlUrl = 'https://api.tradera.com/v3/publicservice.asmx?WSDL';
    const client = await new Promise((resolve, reject) =>
      soap.createClient(wsdlUrl, { wsdl_headers: { 'User-Agent': 'Widget/1.0' } }, (e, c) => e ? reject(e) : resolve(c))
    );
    // Anropa GetItemsInformation
    const args = { itemIds: { long: [parseInt(id)] } };
    client.GetItemsInformation(args, (err, result) => {
      if (err || !result?.GetItemsInformationResult?.Items?.Item) {
        res.status(500).end('<p>Misslyckades hämta data.</p>');
        return;
      }
      let item = result.GetItemsInformationResult.Items.Item;
      if (Array.isArray(item)) item = item[0];

      const price    = item.CurrentPrice?.Amount ?? item.CurrentPrice ?? '–';
      const bids     = item.NumberOfBids ?? '–';
      const endTime  = item.EndTime ? new Date(item.EndTime).toLocaleString('sv-SE') : '–';

      // Skicka tillbaka en enkel HTML-bit
      res.status(200).end(`
        <style>
          .tradera-widget { font-family:sans-serif; padding:0.5em; border:1px solid #ddd; border-radius:4px; }
          .tradera-widget p { margin:0.3em 0; font-size:14px; }
        </style>
        <div class="tradera-widget">
          <p><strong>Ledande bud:</strong> ${price} kr</p>
          <p><strong>Antal bud:</strong> ${bids} st</p>
          <p><strong>Slutar:</strong> ${endTime}</p>
        </div>
      `);
    });
  } catch (e) {
    console.error(e);
    res.status(500).end('<p>Fel i servern.</p>');
  }
}

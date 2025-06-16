import { soap } from 'strong-soap';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing auction ID" });
  }

  const wsdlUrl = 'https://api.tradera.com/v3/publicservice.asmx?WSDL';

  const requestArgs = {
    itemIds: { long: [parseInt(id)] }
  };

  const options = {
    wsdl_headers: {
      'User-Agent': 'Tradera-Proxy/Modern (+https://vaxjoelektriska.se)'
    }
  };

  soap.createClient(wsdlUrl, options, (err, client) => {
    if (err) {
      console.error("SOAP client creation failed:", err);
      return res.status(500).json({ error: "Failed to create SOAP client" });
    }

    client.GetItemsInformation(requestArgs, (err, result) => {
      if (err) {
        console.error("SOAP request failed:", err);
        return res.status(500).json({ error: "SOAP request error", details: err.message });
      }

      if (!result?.GetItemsInformationResult?.Items?.Item) {
        console.error("No item found in result:", result);
        return res.status(404).json({ error: "No item found for provided ID" });
      }

      let item = result.GetItemsInformationResult.Items.Item;
      if (Array.isArray(item)) item = item[0];

      const title = item?.Title || '';
      const numberOfBids = item?.NumberOfBids || 0;
      const currentPrice = item?.CurrentPrice?.Amount || item?.CurrentPrice || 0;
      const endTime = item?.EndTime || null;

      return res.status(200).json({
        auctionId: id,
        title,
        numberOfBids,
        currentPrice,
        endTime
      });
    });
  });
}

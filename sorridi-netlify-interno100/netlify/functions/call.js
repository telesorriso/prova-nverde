const crypto = require("crypto");
const fetch = require("node-fetch");

exports.handler = async (event) => {
  try {
    const { phone } = JSON.parse(event.body);

    const apiKey = process.env.ZADARMA_USER_KEY;
    const apiSecret = process.env.ZADARMA_SECRET_KEY;
    const baseUrl = "https://api.zadarma.com";

    const from = process.env.STUDIO_FROM || "100";
    const to = phone;
    const callerId = process.env.CALLER_ID_FROM || "+39800940533";

    const path = "/v1/request/callback/";
    const params = `from=${from}&to=${to}&caller_id=${callerId}`;

    const sign = crypto
      .createHmac("sha1", apiSecret)
      .update(path + params + apiSecret)
      .digest("base64");

    const res = await fetch(`${baseUrl}${path}?${params}`, {
      headers: {
        Authorization: `${apiKey}:${sign}`,
      },
    });

    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

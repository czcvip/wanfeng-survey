const http = require("http");
const TableStore = require("tablestore");

const ENDPOINT = "https://m026fekm931d.cn-hangzhou.ots.aliyuncs.com";
const INSTANCE_NAME = "m026fekm931d";
const TABLE_NAME = "survey_submissions";
const PORT = process.env.FC_SERVER_PORT || 9000;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, resp) => {
  resp.setHeader("Access-Control-Allow-Origin", "*");
  resp.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  resp.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    resp.statusCode = 204;
    resp.end();
    return;
  }
  if (req.method !== "POST") {
    resp.statusCode = 405;
    resp.setHeader("Content-Type", "application/json");
    resp.end(JSON.stringify({ success: false, error: "method_not_allowed" }));
    return;
  }

  try {
    const raw = await readBody(req);
    const data = JSON.parse(raw || "{}");

    const recordId = String(data.record_id || `WF-${Date.now()}`);
    const submittedAt = String(data.submitted_at || new Date().toISOString());

    const client = new TableStore.Client({
      accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
      secretAccessKey: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
      stsToken: process.env.ALIBABA_CLOUD_SECURITY_TOKEN,
      endpoint: ENDPOINT,
      instancename: INSTANCE_NAME,
    });

    await client.putRow({
      tableName: TABLE_NAME,
      condition: new TableStore.Condition(TableStore.RowExistenceExpectation.IGNORE, null),
      primaryKey: [{ record_id: recordId }],
      attributeColumns: [
        { submitted_at: submittedAt },
        { respondent_type: String(data.respondent_type || "") },
        { name: String(data.name || "") },
        { phone: String(data.phone || "") },
        { route_from: String(data.route_from || "") },
        { route_to: String(data.route_to || "") },
        { raw_data: JSON.stringify(data) },
      ],
    });

    resp.statusCode = 200;
    resp.setHeader("Content-Type", "application/json");
    resp.end(JSON.stringify({ success: true, record_id: recordId }));
  } catch (err) {
    console.error("SURVEY_ERROR:", err && err.message);
    resp.statusCode = 500;
    resp.setHeader("Content-Type", "application/json");
    resp.end(JSON.stringify({ success: false, error: (err && err.message) || String(err) }));
  }
});

server.listen(PORT, () => console.log(`survey fc listening on ${PORT}`));

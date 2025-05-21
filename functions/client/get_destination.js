import { onRequest } from "firebase-functions/v2/https";
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();
const dataset = "tracking";
const table = "search_destination";

export const getSearchDestinations = onRequest({ region: "us-central1" }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

   // ✅ Xử lý preflight request (OPTIONS)
   if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    const { startDate, endDate, page = 1, limit = 50 } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Thiếu startDate hoặc endDate" });
    }

    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        id,
        ANY_VALUE(name) AS name,
        COUNT(*) AS totalSearch
      FROM \`vietravel-app.${dataset}.${table}\`
      WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN "${startDate}" AND "${endDate}"
        AND id IS NOT NULL
      GROUP BY id
      ORDER BY totalSearch DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const [rows] = await bigquery.query({ query });

    return res.json({
      success: true,
      message: "📋 Lấy danh sách search destiantion thành công!",
      data: {
        list: rows,
      },
    });
  } catch (err) {
    console.error("❌ BigQuery error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi truy vấn search destination",
      data: {},
    });
  }
});
import { onRequest } from "firebase-functions/v2/https";
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();
const dataset = "tracking";
const table = "search_keyword";
const pageSize = 50;

export const getSearchKeywords = onRequest({ region: "us-central1" }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).send("");

  try {
    const { startDate, endDate, page = 1 } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Thiếu startDate hoặc endDate" });
    }

    const offset = (page - 1) * pageSize;

    // Tổng số keyword
    const countQuery = `
      SELECT COUNT(DISTINCT keyWordConvert) AS totalKeyword
      FROM \`vietravel-app.${dataset}.${table}\`
      WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN @startDate AND @endDate
        AND keyWordConvert IS NOT NULL
    `;

    const [countResult] = await bigquery.query({
      query: countQuery,
      params: { startDate, endDate }
    });

    const totalKeyword = countResult[0]?.totalKeyword || 0;

    // Lấy danh sách theo phân trang
    const dataQuery = `
      SELECT 
        keyWordConvert,
        ANY_VALUE(keyWord) AS keyWord,
        COUNT(*) AS total
      FROM \`vietravel-app.${dataset}.${table}\`
      WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN @startDate AND @endDate
        AND keyWordConvert IS NOT NULL
      GROUP BY keyWordConvert
      ORDER BY total DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    const [rows] = await bigquery.query({
      query: dataQuery,
      params: { startDate, endDate }
    });

    return res.json({
      success: true,
      message: "📋 Lấy danh sách keyword thành công!",
      data: {
        totalKeyword,
        list: rows.map(r => ({
            keyWord: r.keyWord,
          keyWordConvert:r.keyWordConvert,
          total: r.total
        }))
      }
    });

  } catch (err) {
    console.error("❌ BigQuery error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi truy vấn keyword",
      data: {}
    });
  }
});
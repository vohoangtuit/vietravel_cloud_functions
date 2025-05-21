import { onRequest } from "firebase-functions/v2/https";
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();
const dataset = "tracking";
const table = "screen_views";

export const getScreenViews = onRequest({ region: "us-central1" }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).send("");

  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Thiếu startDate hoặc endDate" });
    }

    const query = `
      SELECT 
        screenViewId,
        ANY_VALUE(screenView) AS screenView,
        COUNT(*) AS total
      FROM \`vietravel-app.${dataset}.${table}\`
      WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN @startDate AND @endDate
        AND screenViewId IS NOT NULL
      GROUP BY screenViewId
      ORDER BY total DESC
    `;

    const [rows] = await bigquery.query({
      query,
      params: { startDate, endDate }
    });

    return res.json({
      success: true,
      message: "📋 Lấy danh sách screens thành công!",
      data: {
        list: rows.map(r => ({
          screenView: r.screenView,
          screenViewId: r.screenViewId,
          total: r.total
        }))
      }
    });

  } catch (err) {
    console.error("❌ BigQuery error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi truy vấn screen views",
      data: {}
    });
  }
});

export const getScreenViewDetail = onRequest({ region: "us-central1" }, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
  
    if (req.method === "OPTIONS") return res.status(204).send("");
  
    try {
      const { startDate, endDate, screenViewId, page = 1, limit = 50 } = req.body;
  
      if (!startDate || !endDate || !screenViewId) {
        return res.status(400).json({ error: "Thiếu startDate, endDate hoặc screenViewId" });
      }
  
      const offset = (page - 1) * limit;
  
      // Total count query
      const countQuery = `
        SELECT COUNT(*) AS totalView
        FROM \`vietravel-app.${dataset}.${table}\`
        WHERE screenViewId = @screenViewId
          AND PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN @startDate AND @endDate
      `;
  
      const [countResult] = await bigquery.query({
        query: countQuery,
        params: { screenViewId, startDate, endDate },
      });
  
      const totalView = countResult[0]?.totalView || 0;
  
      // Data list query
      const detailQuery = `
        SELECT 
          screenView,
          screenViewId,
          deviceName,
          yearMonthDayHHMMSS,
          location
        FROM \`vietravel-app.${dataset}.${table}\`
        WHERE screenViewId = @screenViewId
          AND PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN @startDate AND @endDate
        ORDER BY yearMonthDayHHMMSS DESC
        LIMIT @limit OFFSET @offset
      `;
  
      const [list] = await bigquery.query({
        query: detailQuery,
        params: { screenViewId, startDate, endDate, limit, offset },
      });
  
      return res.json({
        success: true,
        message: "📋 Lấy danh sách screens detail thành công!",
        data: {
          screenViewId,
          totalView,
          list
        }
      });
  
    } catch (err) {
      console.error("❌ BigQuery error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi truy vấn screen view detail",
        data: {}
      });
    }
  });
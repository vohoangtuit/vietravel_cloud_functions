import { onRequest } from "firebase-functions/v2/https";
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();
const dataset = "tracking";
const table = "event_click";

export const getEventClicks = onRequest({ region: "us-central1" }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).send("");

  try {
    const { startDate, endDate, page = 1, limit = 50 } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Thiếu startDate hoặc endDate" });
    }

    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        ANY_VALUE(clickName) AS clickName,
        eventName,
        COUNT(*) AS totalClick
      FROM \`vietravel-app.${dataset}.${table}\`
      WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN "${startDate}" AND "${endDate}"
        AND eventName IS NOT NULL
      GROUP BY eventName
      ORDER BY totalClick DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const [rows] = await bigquery.query({ query });

    return res.json({
      success: true,
      message: "📋 Lấy danh sách Event Clicks thành công!",
      data: {
        list: rows
      }
    });

  } catch (err) {
    console.error("❌ BigQuery error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi truy vấn dữ liệu Event Clicks",
      data: {}
    });
  }
});

export const getEventClickDetail = onRequest({ region: "us-central1" }, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
  
    if (req.method === "OPTIONS") return res.status(204).send("");
  
    try {
      const { eventName, startDate, endDate, page = 1, limit = 50 } = req.body;
  
      if (!eventName || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Thiếu eventName hoặc startDate hoặc endDate"
        });
      }
  
      const offset = (page - 1) * limit;
  
      // Query tổng số click
      const countQuery = `
        SELECT COUNT(*) AS totalClick
        FROM \`vietravel-app.${dataset}.${table}\`
        WHERE eventName = @eventName
          AND PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN @startDate AND @endDate
      `;
  
      const [countRows] = await bigquery.query({
        query: countQuery,
        params: { eventName, startDate, endDate }
      });
  
      const totalClick = countRows[0]?.totalClick || 0;
  
      // Query chi tiết
      const detailQuery = `
        SELECT 
          yearMonthDay,
          clickName,
          eventName,
          fullName,
          yearMonthDayHHMMSS,
          deviceName,
          location
        FROM \`vietravel-app.${dataset}.${table}\`
        WHERE eventName = @eventName
          AND PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN @startDate AND @endDate
        ORDER BY yearMonthDayHHMMSS DESC
        LIMIT @limit
        OFFSET @offset
      `;
  
      const [listRows] = await bigquery.query({
        query: detailQuery,
        params: { eventName, startDate, endDate, limit, offset }
      });
  
      return res.json({
        success: true,
        message: "📋 Lấy danh sách Event Clicks thành công!",
        data: {
          totalClick,
          eventName,
          list: listRows
        }
      });
  
    } catch (err) {
      console.error("❌ BigQuery error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi truy vấn dữ liệu Event Click Detail",
        data: {}
      });
    }
  });
import { onRequest } from "firebase-functions/v2/https";
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();
const dataset = "tracking";
const limit = 50;

export const getBookingSummary = onRequest({ region: "us-central1" }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).send("");

  try {
    const { startDate, endDate, tourPage, hotelPage, flightPage } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Thiếu startDate hoặc endDate" });
    }

    const configs = {
      tour: {
        table: "book_tour_success",
        amountField: "totalAmount",
        page: tourPage,
      },
      hotel: {
        table: "book_hotel_success",
        amountField: "CAST(bookingPrice AS FLOAT64)",
        page: hotelPage,
      },
      flight: {
        table: "book_flight_success",
        amountField: "CAST(bookingPrice AS FLOAT64)",
        page: flightPage,
      },
    };

    const results = {};

    for (const [type, { table, amountField, page }] of Object.entries(configs)) {
      if (!page) continue;

      const offset = (page - 1) * limit;

      // Summary query
      const summaryQuery = `
        SELECT 
          COUNT(*) AS totalBookings,
          SUM(${amountField}) AS totalRevenue,
          MIN(${amountField}) AS minPrice,
          MAX(${amountField}) AS maxPrice
        FROM \`vietravel-app.${dataset}.${table}\`
        WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN "${startDate}" AND "${endDate}"
      `;

      // List data query with pagination
      const listQuery = `
      SELECT 
        * 
      FROM \`vietravel-app.${dataset}.${table}\`
      WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN "${startDate}" AND "${endDate}"
      ORDER BY yearMonthDay DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

      const [summary] = await bigquery.query({ query: summaryQuery });
      const [list] = await bigquery.query({ query: listQuery });

      results[type] = {
        ...summary[0],
        list,
      };
    }

    return res.json({
      success: true,
      message: "📊 Thống kê booking từ ngày đến ngày",
      data: results,
    });
  } catch (err) {
    console.error("❌ Lỗi BigQuery:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi truy vấn BigQuery.",
      data: {}
    });
  }
});

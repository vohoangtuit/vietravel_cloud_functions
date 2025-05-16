import { onRequest } from "firebase-functions/v2/https";
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();
const dataset = "tracking";
const intervalDay =30;
export const getUserTrends = onRequest({ region: "us-central1" }, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
  
    if (req.method === "OPTIONS") return res.status(204).send("");
  
    try {
      const queries = {
        keywords: `
          SELECT 
            keyWordConvert,
            ANY_VALUE(keyWord) AS KeyWord,
            COUNT(*) AS total
          FROM \`vietravel-app.${dataset}.search_keyword\`
          WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL ${intervalDay} DAY) AND CURRENT_DATE()
          GROUP BY keyWordConvert
          ORDER BY total DESC
          LIMIT 5;
        `,
        destinations: `
          SELECT 
            id, 
            ANY_VALUE(name) AS name, 
            COUNT(*) AS total
          FROM \`vietravel-app.${dataset}.search_destination\`
          WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL ${intervalDay} DAY) AND CURRENT_DATE()
          GROUP BY id
          ORDER BY total DESC
          LIMIT 5;
        `,
        tours: `
          SELECT 
            pageId, tourCode, tourId, COUNT(*) AS totalViews,
            ANY_VALUE(pageTitle) AS pageTitle,
            ANY_VALUE(price) AS price,
            ANY_VALUE(departureName) AS departureName,
            ANY_VALUE(imgUrl) AS imgUrl
          FROM \`vietravel-app.${dataset}.tour_detail\`
          WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL ${intervalDay} DAY) AND CURRENT_DATE()
          GROUP BY pageId, tourCode, tourId
          ORDER BY totalViews DESC
          LIMIT 8;
        `,
        flights: `
          SELECT 
            airportCodeFrom || " → " || airportCodeTo AS route,
            COUNT(*) AS total,
            ANY_VALUE(airportNameFrom) AS airportNameFrom,
            ANY_VALUE(airportCodeFrom) AS airportCodeFrom,
            ANY_VALUE(airportAddressFrom) AS airportAddressFrom,
            ANY_VALUE(airportNameTo) AS airportNameTo,
            ANY_VALUE(airportCodeTo) AS airportCodeTo,
            ANY_VALUE(airportAddressTo) AS airportAddressTo
          FROM \`vietravel-app.${dataset}.search_flights\`
          WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL ${intervalDay} DAY) AND CURRENT_DATE()
          GROUP BY route
          ORDER BY total DESC
          LIMIT 4;
        `,
        hotels: `
          SELECT 
            id,
            ANY_VALUE(title) AS title,
            ANY_VALUE(cityId) AS cityId,
            ANY_VALUE(cityName) AS cityName,
            ANY_VALUE(countryId) AS countryId,
            ANY_VALUE(countryName) AS countryName,
            COUNT(*) AS total
          FROM \`vietravel-app.${dataset}.search_hotel\`
          WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL ${intervalDay} DAY) AND CURRENT_DATE()
          GROUP BY id
          ORDER BY total DESC
          LIMIT 8;
        `,
      };
  
      const results = {};
      for (const [key, query] of Object.entries(queries)) {
        const [rows] = await bigquery.query({ query });
        results[key] = rows;
      }
  
      return res.json({
        success: true,
        message: "📊 Truy vấn xu hướng người dùng thành công!",
        data: results,
      });
    } catch (err) {
      return res.json({
        success: false,
        message: "Lỗi khi truy vấn BigQuery.",
        data: {},
      });
    }
  });
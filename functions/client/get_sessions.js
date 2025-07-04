import { onRequest } from "firebase-functions/v2/https";
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();
const dataset = "tracking";
const table = "sessions";


export const getSessions = onRequest({ region: "us-central1" }, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).send("");

  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Thiếu startDate hoặc endDate" });
    }

    const offset = (page - 1) * limit;

    // Step 1: Tổng số user (distinct customerCode)
    const totalUserQuery = `
      SELECT COUNT(DISTINCT customerCode) AS totalUser
      FROM \`vietravel-app.${dataset}.${table}\`
      WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN "${startDate}" AND "${endDate}"
        AND customerCode IS NOT NULL
    `;
    const [totalUserResult] = await bigquery.query({ query: totalUserQuery });
    const totalUser = totalUserResult[0]?.totalUser || 0;

    // Step 2: Đếm theo deviceType
    const deviceQuery = `
      SELECT deviceType, COUNT(DISTINCT customerCode) AS total
      FROM \`vietravel-app.${dataset}.${table}\`
      WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN "${startDate}" AND "${endDate}"
        AND customerCode IS NOT NULL
      GROUP BY deviceType
    `;
    const [deviceRows] = await bigquery.query({ query: deviceQuery });
    let android = 0, ios = 0;
    for (const row of deviceRows) {
      if (row.deviceType === "1") android = row.total;
      if (row.deviceType === "2") ios = row.total;
    }

    // Step 3: Get list of user summary
    const summaryQuery = `
      SELECT 
        customerCode,
        ANY_VALUE(fullName) AS fullName,
        ANY_VALUE(userCode) AS userCode,
        ANY_VALUE(phone) AS phone,
        COUNT(*) AS sessionCount,
        SUM(CAST(duration AS INT64)) AS totalDuration
      FROM \`vietravel-app.${dataset}.${table}\`
      WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN "${startDate}" AND "${endDate}"
        AND customerCode IS NOT NULL
      GROUP BY customerCode
      ORDER BY totalDuration DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const [summaryRows] = await bigquery.query({ query: summaryQuery });
    const results = [];

    // Step 4: Get list of sessions for each user
    for (const row of summaryRows) {
      const sessionQuery = `
        SELECT 
          customerCode,
          fullName,
          userCode,
          phone,
          duration,
          yearMonthDay,
          yearMonthDayHHMMSS,
          deviceType
        FROM \`vietravel-app.${dataset}.${table}\`
        WHERE customerCode = @customerCode
          AND PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN "${startDate}" AND "${endDate}"
        ORDER BY yearMonthDay DESC
      `;

      const options = {
        query: sessionQuery,
        params: { customerCode: row.customerCode },
      };

      const [sessions] = await bigquery.query(options);

      results.push({
        customerCode: row.customerCode,
        fullName: row.fullName,
        userCode: row.userCode,
        phone: row.phone,
        sessionCount: row.sessionCount,
        totalDuration: row.totalDuration,
        list: sessions
      });
    }

    return res.json({
      success: true,
      message: "📋 Lấy danh sách sessions thành công!",
      data: {
        totalUser,
        android,
        ios,
        users: results
      }
    });
  } catch (err) {
    console.error("❌ BigQuery error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi truy vấn sessions",
      data: {}
    });
  }
});

export const getUserDemographics = onRequest({ region: "us-central1" }, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
  
    if (req.method === "OPTIONS") return res.status(204).send("");
  
    try {
      const {
        startDate,
        endDate,
        ageFrom = "0",
        ageTo = "100",
        gender = "all",
        page = 1,
        limit = 30
      } = req.body;
  
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Thiếu startDate hoặc endDate" });
      }
  
      const offset = (page - 1) * limit;
      const ageFromInt = parseInt(ageFrom) || 0;
      const ageToInt = parseInt(ageTo) || 100;
  
      // Xây dựng WHERE clause động
      const whereConditions = [
        `PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN @startDate AND @endDate`,
        `customerCode IS NOT NULL`,
        `gender IS NOT NULL`,
        `age IS NOT NULL`,
        `SAFE_CAST(age AS INT64) BETWEEN @ageFrom AND @ageTo`
      ];
      if (gender !== "all") {
        whereConditions.push(`gender = @gender`);
      }
      const whereClause = whereConditions.join(" AND ");
  
      // Query tổng số user
      const countQuery = `
        SELECT COUNT(DISTINCT customerCode) AS totalUser
        FROM \`vietravel-app.${dataset}.${table}\`
        WHERE ${whereClause}
      `;
      const [countResult] = await bigquery.query({
        query: countQuery,
        params: { startDate, endDate, ageFrom: ageFromInt, ageTo: ageToInt, gender }
      });
      const totalUser = countResult[0]?.totalUser || 0;
  
      // Query danh sách user
      const listQuery = `
        SELECT 
          customerCode,
          ANY_VALUE(fullName) AS fullName,
          ANY_VALUE(userCode) AS userCode,
          ANY_VALUE(gender) AS gender,
          ANY_VALUE(age) AS age
        FROM \`vietravel-app.${dataset}.${table}\`
        WHERE ${whereClause}
        GROUP BY customerCode
        ORDER BY fullName
        LIMIT @limit OFFSET @offset
      `;
  
      const [rows] = await bigquery.query({
        query: listQuery,
        params: {
          startDate,
          endDate,
          ageFrom: ageFromInt,
          ageTo: ageToInt,
          gender,
          limit,
          offset
        }
      });
  
      return res.json({
        success: true,
        message: "📋 Lấy danh sách users thành công!",
        data: {
          totalUser,
          users: rows
        }
      });
    } catch (err) {
      console.error("❌ BigQuery error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi truy vấn dữ liệu demographic",
        data: {}
      });
    }
  });
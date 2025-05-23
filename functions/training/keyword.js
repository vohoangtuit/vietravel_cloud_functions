import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { BigQuery } from "@google-cloud/bigquery";
const bigquery = new BigQuery();
const dataset = "tracking";
const modelId = "keyword_model";

// ✅ Hàm dùng chung cho cả gọi tay và schedule
async function runTrainKeywordModel() {
  const query = `
    CREATE OR REPLACE MODEL \`vietravel-app.${dataset}.${modelId}\`
    OPTIONS (
      model_type = 'logistic_reg',
      input_label_cols = ['isPopular']
    ) AS
    SELECT
      keyWordConvert,
      LENGTH(keyWordConvert) AS keywordLength,
      COUNT(*) AS frequency,
      IF(COUNT(*) > 100, 1, 0) AS isPopular
    FROM \`vietravel-app.${dataset}.search_keyword\`
    WHERE 
      PARSE_DATE('%Y-%m-%d', yearMonthDay) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY) AND CURRENT_DATE()
      AND keyWordConvert IS NOT NULL
    GROUP BY keyWordConvert;
  `;
  await bigquery.query({ query });
}

// ✅ Cloud Function để gọi huấn luyện model thủ công
export const trainKeywordModel = onRequest({ region: "us-central1" }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).send("");

  try {
    await runTrainKeywordModel();
    return res.json({
      success: true,
      message: "✅ Mô hình keyword_model đã được huấn luyện hoặc cập nhật thành công."
    });
  } catch (err) {
    console.error("❌ Lỗi khi huấn luyện keyword_model:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi huấn luyện mô hình",
      error: err.message
    });
  }
});

// ✅ Dự đoán keyword phổ biến
export const predictPopularKeywords = onRequest({ region: "us-central1" }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).send("");

  try {
    const { limit = 50 } = req.body;

    const query = `
      SELECT
        predicted_isPopular AS isPopular,
        keyWordConvert,
        keyWord,
        keywordLength,
        frequency
      FROM ML.PREDICT(MODEL \`vietravel-app.${dataset}.${modelId}\`, (
        SELECT
          keyWordConvert,
          ANY_VALUE(keyWord) AS keyWord,
          LENGTH(keyWordConvert) AS keywordLength,
          COUNT(*) AS frequency
        FROM \`vietravel-app.${dataset}.search_keyword\`
        WHERE PARSE_DATE('%Y-%m-%d', yearMonthDay) IS NOT NULL
          AND keyWordConvert IS NOT NULL
        GROUP BY keyWordConvert
      ))
      ORDER BY frequency DESC
      LIMIT ${limit};
    `;

    const [rows] = await bigquery.query({ query });

    return res.json({
      success: true,
      message: "📊 Dự đoán keyword phổ biến thành công!",
      data: rows
    });
  } catch (err) {
    console.error("❌ BigQuery error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi dự đoán keyword",
      error: err.message
    });
  }
});

// ✅ Tự động chạy mỗi Chủ nhật 23:00 (Asia/Ho_Chi_Minh)
export const scheduledTrainKeywordModel = onSchedule({
  schedule: "0 23 * * 0",
  timeZone: "Asia/Ho_Chi_Minh"
}, async () => {
  try {
    await runTrainKeywordModel();
    console.log("✅ Mô hình keyword_model đã được training định kỳ thành công.");
  } catch (err) {
    console.error("❌ Lỗi khi training theo lịch:", err.message);
  }
});
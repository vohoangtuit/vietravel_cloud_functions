// Hàm detectIntentFromKeywords
import { BigQuery } from '@google-cloud/bigquery';
const bigquery = new BigQuery();

const DATASET = 'tracking';
const INTENT_MAPPING_TABLE = 'mapping_intent';
/**
 * Dò intent từ danh sách keywords đã chuẩn hoá
 * Nếu một keyword xuất hiện trong nhiều intent => gom intent
 */
export async function detectIntentFromKeywords(keywords) {
  if (!Array.isArray(keywords) || keywords.length === 0) return [];

  const query = `
    SELECT DISTINCT intent
    FROM \`${DATASET}.${INTENT_MAPPING_TABLE}\`
    WHERE LOWER(TRIM(keyword)) IN UNNEST(@keywords)
  `;

  const [rows] = await bigquery.query({
    query,
    params: { keywords }
  });

  return rows.map(row => row.intent);
}

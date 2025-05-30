import { BigQuery } from "@google-cloud/bigquery";
const bigquery = new BigQuery();

const DATASET = "tracking";
const SYNONYM_TABLE = "synonyms";

// Chuẩn hoá từ bằng bảng synonyms
export async function normalizeKeywords(words) {
  const query = `
    SELECT alias, keyword
    FROM \`tracking.synonyms\`
    WHERE alias IN UNNEST(@words)
  `;
  const [rows] = await bigquery.query({ query, params: { words } });
  const map = Object.fromEntries(rows.map(row => [row.alias, row.keyword]));
  return words.map(w => map[w] || w);
}
// đã cập nhật, nhưng vẫn ko hiểu query
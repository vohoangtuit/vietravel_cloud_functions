import { BigQuery } from "@google-cloud/bigquery";
const bigquery = new BigQuery();

const DATASET = "tracking";
const SYNONYM_TABLE = "synonyms";

// Chuẩn hoá từ bằng bảng synonyms
export async function normalizeKeywords(questionTextRaw) {
  const questionText = String(questionTextRaw || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

  const query = `
    SELECT DISTINCT topic, keyword
    FROM \`${DATASET}.${SYNONYM_TABLE}\`
  `;
  const [rows] = await bigquery.query({ query });

  const matchedTopics = new Set();
  for (const row of rows) {
    const normalizedKeyword = row.keyword.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    if (questionText.includes(normalizedKeyword)) {
      matchedTopics.add(row.topic);
    }
  }

  return Array.from(matchedTopics);
}

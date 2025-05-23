import { BigQuery } from '@google-cloud/bigquery';
const bigquery = new BigQuery();

const DATASET = 'tracking';
const INTENT_MAPPING_TABLE = 'mapping_intent';
const TEMPLATE_TABLE = 'query_template';

export async function getSQLTemplatesFromIntents(intents) {
    if (!intents || intents.length === 0) return [];
  
    const query = `
      SELECT intent, sql_template
      FROM \`${DATASET}.${TEMPLATE_TABLE}\`
      WHERE intent IN UNNEST(@intents)
    `;
  
    const [rows] = await bigquery.query({
      query,
      params: { intents },
    });
  
    return rows; // Trả về danh sách object { intent, sql_template }
  }
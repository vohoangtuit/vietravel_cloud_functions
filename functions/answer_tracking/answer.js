import { onRequest } from "firebase-functions/v2/https";
import { BigQuery } from "@google-cloud/bigquery";

import { getTimeRangeFromText } from "./config/detect_time.js";
import { detectIntentFromKeywords } from "./config/detect_intent_keywords.js";
import { getSQLTemplatesFromIntents } from "./config/query_fetcher.js";
import { detectTopicsFromQuestion } from "./config/topic_detector.js";
import {
  getUserQueries,
  getTourQueries,
  getFlightQueries,
  getHotelQueries,
  getOverviewQueries
} from './query_fetcher.js';
const bigquery = new BigQuery();
// https://us-central1-vietravel-app.cloudfunctions.net/answerTrackingQuery
export const answerTrackingQuery = onRequest({ region: "us-central1" }, async (req, res) => {
  const question = req.body.question || "";
  const rawWords = question.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").split(/\s+/);

  const topics = detectTopicsFromQuestion(rawWords);
  const { fromDate, toDate } = getTimeRangeFromText(question);

  if (topics.length === 0) {
    return res.json({
      answer: "🤖 Xin hỏi rõ hơn. Bạn có thể hỏi về: Tour, Vé máy bay, Khách sạn, User"
    });
  }

  let queries = [];

  for (const topic of topics) {
    if (topic === "user") queries.push(...getUserQueries({ fromDate, toDate }));
    else if (topic === "tour") queries.push(...getTourQueries({ fromDate, toDate }));
    else if (topic === "flight") queries.push(...getFlightQueries({ fromDate, toDate }));
    else if (topic === "hotel") queries.push(...getHotelQueries({ fromDate, toDate }));
  }

  if (queries.length === 0) {
    queries = getOverviewQueries({ fromDate, toDate });
  }

  const results = [];
  for (const { title, query } of queries) {
    const [rows] = await bigquery.query({ query });
    results.push({ title, data: rows });
  }

  return res.json({ answer: results });
});


 // viết answerTrackingQuery đi
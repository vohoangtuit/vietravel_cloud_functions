import { onRequest } from "firebase-functions/v2/https";
import { BigQuery } from "@google-cloud/bigquery";

import { getTimeRangeFromText } from "./config/detect_time.js";
import { detectIntentFromKeywords } from "./config/detect_intent_keywords.js";
import { getSQLTemplatesFromIntents } from "./config/query_fetcher.js";
import { normalizeKeywords,removeDiacritics} from "./config/topic_detector.js";
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
  const matchedTopics = await normalizeKeywords(question);
  const { fromDate, toDate } = getTimeRangeFromText(question);
  const timeRangeLabel = getTimeRangeLabel(fromDate, toDate);
  const summaryTitle = buildSummaryTitle(question,normalizeKeywords, timeRangeLabel);

  if (matchedTopics.length === 0) {
    return res.json({
      status:2,
      answer: "🔍 Xin hỏi rõ hơn. Bạn có thể hỏi về: Tour, Vé máy bay, Khách sạn, User"
    });
  }

  let queries = [];
  for (const topic of matchedTopics) {
    if (topic === "user") queries.push(...getUserQueries({ fromDate, toDate }));
    else if (topic === "tour") queries.push(...getTourQueries({ fromDate, toDate }));
    else if (topic === "flight") queries.push(...getFlightQueries({ fromDate, toDate }));
    else if (topic === "hotel") queries.push(...getHotelQueries({ fromDate, toDate }));
    else if (topic === "general") queries.push(...getOverviewQueries({ fromDate, toDate }));
  }

  const grouped = {};
  for (const { title,type_data, query, topic } of queries) {
    const [rows] = await bigquery.query(query);
    if (!grouped[topic]) grouped[topic] = [];
    grouped[topic].push({ title,type_data, data: rows });
  }

  return res.json({ status:1,answer: { title: summaryTitle, ...grouped } });
});
function getTimeRangeLabel(fromDate, toDate) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (fromDate === toDate) { 
    if (fromDate === today) return "hôm nay";
    if (fromDate === yesterday) return "hôm qua";
  }

  const diffDays = Math.ceil((new Date(toDate) - new Date(fromDate)) / 86400000);
  if (diffDays === 6 || diffDays === 7) return "7 ngày qua";

  return `từ ${fromDate} đến ${toDate}`;
}

function buildSummaryTitle(original, normalized, timeRangeLabel) {
  const timeKeywords = ["hôm nay", "hôm qua", "7 ngày qua", "từ", "đến"];

  let cleaned = original;
  for (const keyword of timeKeywords) {
    const regex = new RegExp(keyword, "gi");
    cleaned = cleaned.replace(regex, "").trim();
  }

  return capitalizeFirst(cleaned) + " " + timeRangeLabel;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

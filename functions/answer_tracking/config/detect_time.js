import { onRequest } from "firebase-functions/v2/https";
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();

const DATASET = 'tracking';

function removeVietnameseTones(str) {
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D");
}

function getTimeRangeFromText(text) {
  const today = new Date();
  const lower = removeVietnameseTones(text.toLowerCase()).replace(/\s+/g, ' ').trim();

  if (lower.includes("hom nay")) {
    const d = today.toISOString().slice(0, 10);
    return { fromDate: d, toDate: d };
  }

  if (lower.includes("hom qua")) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    const date = d.toISOString().slice(0, 10);
    return { fromDate: date, toDate: date };
  }

  if (lower.includes("7 ngay qua")) {
    const toDate = today.toISOString().slice(0, 10);
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    const fromDate = d.toISOString().slice(0, 10);
    return { fromDate, toDate };
  }

  if (lower.includes("thang nay")) {
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const fromDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const toDate = today.toISOString().slice(0, 10);
    return { fromDate, toDate };
  }

  if (lower.includes("thang roi")) {
    const y = today.getFullYear();
    let m = today.getMonth();
    let year = y;
    if (m === 0) {
      m = 12;
      year -= 1;
    }
    const fromDate = `${year}-${String(m).padStart(2, '0')}-01`;
    const toDate = `${year}-${String(m).padStart(2, '0')}-28`;
    return { fromDate, toDate };
  }

  const matchSingleDate = lower.match(/(\d{1,2})[\/\s]?(thang\s*)?(\d{1,2})/);
  if (matchSingleDate) {
    const [_, day, __, month] = matchSingleDate;
    const year = today.getFullYear();
    const d = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { fromDate: d, toDate: d };
  }

  const matchRange = lower.match(/(\d{1,2})[^0-9]+(\d{1,2})[^0-9]+(\d{1,2})[^0-9]+(\d{1,2})/);
  if (matchRange) {
    const [_, d1, m1, d2, m2] = matchRange;
    const y = today.getFullYear();
    const fromDate = `${y}-${String(m1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`;
    const toDate = `${y}-${String(m2).padStart(2, '0')}-${String(d2).padStart(2, '0')}`;
    return { fromDate, toDate };
  }

  const d = today.toISOString().slice(0, 10);
  return { fromDate: d, toDate: d };
}

export { getTimeRangeFromText };
import { onRequest } from "firebase-functions/v2/https";
import { onValueCreated } from "firebase-functions/v2/database";
import { setGlobalOptions } from "firebase-functions/v2";
import admin from "firebase-admin";
import { BigQuery } from "@google-cloud/bigquery";
import axios from "axios";

import db from "./firebase.js";
const bigquery = new BigQuery();
setGlobalOptions({ region: "us-central1", timeoutSeconds: 300 });

const datasetId = "tracking";
const batchSize = 500;


async function doExport(data) {
    const { tableFrom, tableTo, startDate, endDate } = data;
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
  
    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
  
    let totalInserted = 0;
  
    for (const date of dates) {
      //console.log(`📆 Exporting date: ${date} - Table: ${tableFrom} -> ${tableTo}`);
      const snapshot = await db.ref(`Tracking/${tableFrom}/${date}`).once("value");
      const records = snapshot.val();
      if (!records) continue;
  
      const rows = Object.entries(records).map(([key, value]) => {
        const row = {
          key,
          ...value,
          yearMonthDay: value.yearMonthDay || value.dayMonthYear || date
        };
        delete row.dayMonthYear;
        Object.keys(row).forEach((f) => {
          if (row[f] === undefined) row[f] = null;
        });
        return row;
      });
  
      if (rows.length > 0) {
        console.log(`📦 Inserting ${rows.length} new rows for ${date}`);
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          try {
            await bigquery.dataset(datasetId).table(tableTo).insert(batch);
            totalInserted += batch.length;
          } catch (err) {
            console.error(`❌ Insert failed on ${date}:`, err.message);
          }
        }
      }
    }
  
    //console.log(`🎉 Export complete. Total inserted: ${totalInserted}`);
  }
  
  /// Export table General
  export const exportTable = onRequest({ region: "us-central1" }, async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') return res.status(204).send('');
  
    try {
      const data = req.body.data;
      if (!data?.tableFrom || !data?.tableTo || !data?.startDate || !data?.endDate) {
        return res.status(400).json({ error: "Thiếu tham số bắt buộc." });
      }
  
      doExport(data).catch((err) =>
        console.error("❌ Lỗi trong doExport:", err.message)
      );
  
      return res.json({
        data: {
          success: true,
          message: "⏳ Đã nhận yêu cầu export, server đang xử lý ngầm..."
        }
      });
    } catch (err) {
      console.error("❌ exportTable error:", err.message);
      return res.status(500).json({ error: "Lỗi nội bộ khi xử lý exportTable." });
    }
  });
  
  /// Export table TourDetailFrom
  async function doExportTourDetailFrom(data) {
    const { tableFrom, tableTo, startDate, endDate } = data;
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
  
    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
  
    let totalInserted = 0;
  
    for (const date of dates) {
      //console.log(`📆 Exporting date: ${date} - Table: ${tableFrom} -> ${tableTo}`);
      const snapshot = await db.ref(`Tracking/TourDetailFrom/${tableFrom}/${date}`).once("value");
      const records = snapshot.val();
      if (!records) continue;
  
      const rows = Object.entries(records).map(([key, value]) => {
        const row = {
          key,
          ...value,
          yearMonthDay: value.yearMonthDay || value.dayMonthYear || date
        };
        delete row.dayMonthYear;
        Object.keys(row).forEach((f) => {
          if (row[f] === undefined) row[f] = null;
        });
        return row;
      });
  
      if (rows.length > 0) {
        console.log(`📦 Inserting ${rows.length} new rows for ${date}`);
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          try {
            await bigquery.dataset(datasetId).table(tableTo).insert(batch);
            totalInserted += batch.length;
          } catch (err) {
            console.error(`❌ Insert failed on ${date}:`, err.message);
          }
        }
      }
    }
  
    //console.log(`🎉 Export complete. Total inserted: ${totalInserted}`);
  }
  
  export const exportTableTourDetailFrom = onRequest({ region: "us-central1" }, async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') return res.status(204).send('');
  
    try {
      const data = req.body.data;
      if (!data?.tableFrom || !data?.tableTo || !data?.startDate || !data?.endDate) {
        return res.status(400).json({ error: "Thiếu tham số bắt buộc." });
      }
  
      doExportTourDetailFrom(data).catch((err) =>
        console.error("❌ Lỗi trong doExport:", err.message)
      );
  
      return res.json({
        data: {
          success: true,
          message: "⏳ Đã nhận yêu cầu export, server đang xử lý ngầm..."
        }
      });
    } catch (err) {
      console.error("❌ exportTable error:", err.message);
      return res.status(500).json({ error: "Lỗi nội bộ khi xử lý exportTable." });
    }
  });
  
  /// Export table BookingFailed
  async function doExportBookingFailed(data) {
    const { tableFrom, tableTo, startDate, endDate } = data;
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
  
    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
  
    let totalInserted = 0;
  
    for (const date of dates) {
      //console.log(`📆 Exporting date: ${date} - Table: ${tableFrom} -> ${tableTo}`);
      const snapshot = await db.ref(`Tracking/BookingFail/${tableFrom}/${date}`).once("value");
      const records = snapshot.val();
      if (!records) continue;
  
      const rows = Object.entries(records).map(([key, value]) => {
        const row = {
          key,
          ...value,
          yearMonthDay: value.yearMonthDay || value.dayMonthYear || date
        };
        delete row.dayMonthYear;
        Object.keys(row).forEach((f) => {
          if (row[f] === undefined) row[f] = null;
        });
        return row;
      });
  
      if (rows.length > 0) {
        console.log(`📦 Inserting ${rows.length} new rows for ${date}`);
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          try {
            await bigquery.dataset(datasetId).table(tableTo).insert(batch);
            totalInserted += batch.length;
          } catch (err) {
            console.error(`❌ Insert failed on ${date}:`, err.message);
          }
        }
      }
    }
  
    //console.log(`🎉 Export complete. Total inserted: ${totalInserted}`);
  }
  
  export const exportTableBookingFail = onRequest({ region: "us-central1" }, async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') return res.status(204).send('');
  
    try {
      const data = req.body.data;
      if (!data?.tableFrom || !data?.tableTo || !data?.startDate || !data?.endDate) {
        return res.status(400).json({ error: "Thiếu tham số bắt buộc." });
      }
  
      doExportBookingFailed(data).catch((err) =>
        console.error("❌ Lỗi trong doExport:", err.message)
      );
  
      return res.json({
        data: {
          success: true,
          message: "⏳ Đã nhận yêu cầu export, server đang xử lý ngầm..."
        }
      });
    } catch (err) {
      console.error("❌ exportTable error:", err.message);
      return res.status(500).json({ error: "Lỗi nội bộ khi xử lý exportTable." });
    }
  });
  

  /// Export table SearchOnMap
  async function doExportSearchOnMap(data) {
    const { tableFrom, tableTo, startDate, endDate } = data;
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
  
    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
  
    let totalInserted = 0;
  
    for (const date of dates) {
      console.log(`📆 Exporting date: ${date} - Table: ${tableFrom} -> ${tableTo}`);
      const snapshot = await db.ref(`Tracking/SearchOnMap/${tableFrom}/${date}`).once("value");
      const records = snapshot.val();
      if (!records) continue;
  
      const rows = Object.entries(records).map(([key, value]) => {
        const row = {
          key,
          ...value,
          yearMonthDay: value.yearMonthDay || value.dayMonthYear || date
        };
        delete row.dayMonthYear;
        Object.keys(row).forEach((f) => {
          if (row[f] === undefined) row[f] = null;
        });
        return row;
      });
  
      if (rows.length > 0) {
        console.log(`📦 Inserting ${rows.length} new rows for ${date}`);
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          try {
            await bigquery.dataset(datasetId).table(tableTo).insert(batch);
            totalInserted += batch.length;
          } catch (err) {
            console.error(`❌ Insert failed on ${date}:`, err.message);
          }
        }
      }
    }
  
    console.log(`🎉 Export complete. Total inserted: ${totalInserted}`);
  }
  
  export const exportTableSearchOnMap = onRequest({ region: "us-central1" }, async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') return res.status(204).send('');
  
    try {
      const data = req.body.data;
      if (!data?.tableFrom || !data?.tableTo || !data?.startDate || !data?.endDate) {
        return res.status(400).json({ error: "Thiếu tham số bắt buộc." });
      }
  
      doExportSearchOnMap(data).catch((err) =>
        console.error("❌ Lỗi trong doExport:", err.message)
      );
  
      return res.json({
        data: {
          success: true,
          message: "⏳ Đã nhận yêu cầu export, server đang xử lý ngầm..."
        }
      });
    } catch (err) {
      console.error("❌ exportTable error:", err.message);
      return res.status(500).json({ error: "Lỗi nội bộ khi xử lý exportTable." });
    }
  });

  /// Export table Session
  async function doExportSessions(data) {
    const { tableFrom, tableTo, startDate, endDate } = data;
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
  
    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
  
    let totalInserted = 0;
  
    for (const date of dates) {
      console.log(`📅 Exporting date: ${date} - Table: ${tableFrom} -> ${tableTo}`);
      
      // Bước 1: Lấy danh sách tất cả userId tại ngày đó
      const usersSnapshot = await db.ref(`Tracking/${tableFrom}/${date}`).once("value");
      const users = usersSnapshot.val();
      if (!users) continue;
  
      for (const [userId, sessions] of Object.entries(users)) {
        if (!sessions) continue;
  
        const rows = Object.entries(sessions).map(([pushId, value]) => {
          const row = {
            key: pushId,
            userId: userId,
            ...value,
            yearMonthDay: value.yearMonthDay || value.dayMonthYear || date,
          };
          delete row.dayMonthYear;
          Object.keys(row).forEach((f) => {
            if (row[f] === undefined) row[f] = null;
          });
          return row;
        });
  
        if (rows.length > 0) {
          console.log(`📦 Inserting ${rows.length} rows for user ${userId} on ${date}`);
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            try {
              await bigquery.dataset(datasetId).table(tableTo).insert(batch);
              totalInserted += batch.length;
            } catch (err) {
              console.error(`❌ Insert failed for user ${userId} on ${date}:`, err.message);
            }
          }
        }
      }
    }
    console.log(`🎉 Export complete. Total inserted: ${totalInserted}`);
  }
  
  export const exportTableSessions = onRequest({ region: "us-central1" }, async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') return res.status(204).send('');
  
    try {
      const data = req.body.data;
      if (!data?.tableFrom || !data?.tableTo || !data?.startDate || !data?.endDate) {
        return res.status(400).json({ error: "Thiếu tham số bắt buộc." });
      }
  
      // ✅ Không await, xử lý ngầm
      doExportSessions(data).catch((err) =>
        console.error("❌ Lỗi trong doExportSessions:", err.message)
      );
  
      // ✅ Trả response ngay
      return res.json({
        data: {
          success: true,
          message: "⏳ Đã nhận yêu cầu export Sessions, server đang xử lý ngầm..."
        }
      });
    } catch (err) {
      console.error("❌ exportTableSessions error:", err.message);
      return res.status(500).json({ error: "Lỗi nội bộ khi xử lý exportTableSessions." });
    }
  });
  
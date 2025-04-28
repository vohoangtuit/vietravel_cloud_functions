// ✅ Cloud Function: Export Firebase Realtime Database to BigQuery (GCF Gen 2 - firebase-functions v2 with Cloud Tasks)
const { onRequest } = require("firebase-functions/v2/https");
const { onValueCreated } = require("firebase-functions/v2/database");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { BigQuery } = require("@google-cloud/bigquery");
const axios = require("axios");

admin.initializeApp();
const db = admin.database();
const bigquery = new BigQuery();
setGlobalOptions({ region: "us-central1", timeoutSeconds: 300 });

const datasetId = "tracking";
const batchSize = 500;
const tableNameMap = {
  UsedApp: "usage_app",
  Sessions: "sessions",
  EventClicks: "event_click",
  SearchKeyWords: "search_keyword",
  SearchDestination: "search_destination",
  SignInAccount: "sign_in_account",
  ScreenViews: "screen_views",
  SearchTour: "search_tour",
  SearchCombo: "search_combo",
  SearchOnMap: "search_on_map",
  ChatBot: "tour_detail_from",// tour defail from chat bot
  Notifications: "notification",
  BookTourComplete: "book_tour_success",
  BookHotelSuccess: "book_hotel_success",
  BookFlightSuccess: "book_flight_success",
  BookHotelAndFlightSuccess: "book_hotel_flight_success",
  BookSightSeeingSuccess: "book_sight_seeing_success",
  BookTourFailed: "book_tour_failed",
  BookHotelFailed: "book_hotel_failed",
  BookFlightFailed: "book_flight_failed",
  BookHotelFlightFailed: "book_hotel_flight_failed",
  BookSightSeeingFailed: "book_sight_seeing_failed",
  TestTracking: "test_tracking",
  CategoryOnMap: "map_search_category",
  DetailOnMap: "map_detail",
  TextOnMap: "map_search_text"
  
};

exports.insertToBigQuery = onRequest(async (req, res) => {
  const data = req.body;
  const { key, tableName, date } = data;

 // console.log("📨 Payload nhận được:", data);
 // console.log("✅ tableName:", tableName);
 // console.log("✅ Có trong tableNameMap:", !!tableNameMap[tableName]);

  if (!data || !tableName || !tableNameMap[tableName]) {
    console.log(`❌ Missing data or unknown table:`, data);
    return res.status(400).send("Invalid request");
  }

  const bqTable = tableNameMap[tableName];

  const row = {
    key,
    yearMonthDay: date,
    ...data
  };

  delete row.tableName;
  delete row.date;

  Object.keys(row).forEach((k) => {
    if (row[k] === undefined) row[k] = null;
  });

  //console.log("📦 Row chuẩn bị insert vào BigQuery:", row);

  try {
    await bigquery.dataset(datasetId).table(bqTable).insert(row);
    console.log(`✅ Inserted into ${bqTable}: ${key}`);
    res.status(200).send("Inserted");
  } catch (err) {
   // console.error(`❌ Failed insert:`, err);

    if (err.name === "PartialFailureError" && err.errors) {
      err.errors.forEach((e, i) => {
        console.error(`➡️ Lỗi dòng ${i}:`, JSON.stringify(e.errors));
        console.error(`➡️ Dữ liệu lỗi dòng ${i}:`, JSON.stringify(e.row));
      });
    }

    res.status(500).send("Insert failed");
  }
});
// Path lưu giống nhau nên gôm chung
exports.realtimeToBigQuery = onValueCreated(
  "/Tracking/{tableName}/{date}/{pushId}",
  async (event) => {
    const data = event.data.val();
    const key = event.data.key;
    const { tableName, date } = event.params;
    if (isNaN(dateObj.getTime()) || dateObj < new Date("2025-05-01")) {
     // console.log("⏳ Bỏ qua realtimeBookingFaild vì chưa đến ngày 2025-05-01:", date);
      return;
    }
    const url = `https://us-central1-vietravel-app.cloudfunctions.net/insertToBigQuery`;

    const payload = {
      key,
      date,
      tableName,
      ...data
    };

    try {
      await axios.post(url, payload);
     // console.log("📤 Dispatched to Cloud Task (Realtime)");
    } catch (err) {
      console.error("❌ Failed to dispatch task (Realtime):", err.message);
    }
  }
);
/// Sesstion thêm 1 cấo nữa nên làm riêng
exports.realtimeSession = onValueCreated(
  "/Tracking/Sessions/{date}/{userId}/{pushId}",
  async (event) => {
    const data = event.data.val();
    const key = event.data.key;
    const { date } = event.params;
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime()) || dateObj < new Date("2025-05-01")) {
     // console.log("⏳ Bỏ qua realtimeBookingFaild vì chưa đến ngày 2025-05-01:", date);
      return;
    }

    const url = `https://us-central1-vietravel-app.cloudfunctions.net/insertToBigQuery`;

    const payload = {
      key,
      date,
      tableName: "Sessions", // ✅ Gán cứng đúng tên
      ...data
    };

    try {
      await axios.post(url, payload);
    //  console.log("📤 Dispatched to Cloud Task (Sessions)");
    } catch (err) {
      console.error("❌ Failed to dispatch task (Sessions):", err.message);
    }
  }
);
/// SearchOnMap/CategoryOnMap path cấo nữa nên làm riêng
exports.realtimeMapCategory = onValueCreated(
  "/Tracking/SearchOnMap/CategoryOnMap/{date}/{pushId}",
  async (event) => {
    const data = event.data.val();
    const key = event.data.key;
    const { date } = event.params;
    if (isNaN(dateObj.getTime()) || dateObj < new Date("2025-05-01")) {
      // console.log("⏳ Bỏ qua realtimeBookingFaild vì chưa đến ngày 2025-05-01:", date);
       return;
     }
    const url = `https://us-central1-vietravel-app.cloudfunctions.net/insertToBigQuery`;

    const payload = {
      key,
      date,
      tableName: "CategoryOnMap", // ✅ Gán cứng đúng tên
      ...data
    };
    try {
      await axios.post(url, payload);
    //  console.log("📤 Dispatched to Cloud Task (CategoryOnMap)");
    } catch (err) {
      console.error("❌ Failed to dispatch task (CategoryOnMap):", err.message);
    }
  }
);
/// SearchOnMap/CategoryOnMap path cấo nữa nên làm riêng
exports.realtimeMapDetail = onValueCreated(
  "/Tracking/SearchOnMap/DetailOnMap/{date}/{pushId}",
  async (event) => {
    const data = event.data.val();
    const key = event.data.key;
    const { date } = event.params;
    if (isNaN(dateObj.getTime()) || dateObj < new Date("2025-05-01")) {
      // console.log("⏳ Bỏ qua realtimeBookingFaild vì chưa đến ngày 2025-05-01:", date);
       return;
     }
    const url = `https://us-central1-vietravel-app.cloudfunctions.net/insertToBigQuery`;

    const payload = {
      key,
      date,
      tableName: "DetailOnMap", // ✅ Gán cứng đúng tên
      ...data
    };
    try {
      await axios.post(url, payload);
    //  console.log("📤 Dispatched to Cloud Task (DetailOnMap)");
    } catch (err) {
      console.error("❌ Failed to dispatch task (DetailOnMap):", err.message);
    }
  }
);
/// SearchOnMap/TextOnMap path cấo nữa nên làm riêng
exports.realtimeTextOnMap = onValueCreated(
  "/Tracking/SearchOnMap/TextOnMap/{date}/{pushId}",
  async (event) => {
    const data = event.data.val();
    const key = event.data.key;
    const { date } = event.params;
    if (isNaN(dateObj.getTime()) || dateObj < new Date("2025-05-01")) {
      // console.log("⏳ Bỏ qua realtimeBookingFaild vì chưa đến ngày 2025-05-01:", date);
       return;
     }
    const url = `https://us-central1-vietravel-app.cloudfunctions.net/insertToBigQuery`;

    const payload = {
      key,
      date,
      tableName: "TextOnMap", // ✅ Gán cứng đúng tên
      ...data
    };
    try {
      await axios.post(url, payload);
    //  console.log("📤 Dispatched to Cloud Task (DetailOnMap)");
    } catch (err) {
      console.error("❌ Failed to dispatch task (DetailOnMap):", err.message);
    }
  }
);
/// Booking Failed thêm 1 cấo nữa nên làm riêng
exports.realtimeBookingFaild = onValueCreated(
  "/Tracking/BookingFail/{tableName}/{date}/{pushId}",
  async (event) => {
    const data = event.data.val();
    const key = event.data.key;
    const { tableName, date } = event.params;
    if (isNaN(dateObj.getTime()) || dateObj < new Date("2025-05-01")) {
    //  console.log("⏳ Bỏ qua realtimeBookingFaild vì chưa đến ngày 2025-05-01:", date);
      return;
    }
    const url = `https://us-central1-vietravel-app.cloudfunctions.net/insertToBigQuery`;

    const payload = {
      key,
      date,
      tableName,
      ...data
    };

   // console.log("🚨 Trigger realtimeBookingFaild:", payload);

    try {
      await axios.post(url, payload);
      //console.log("📤 Dispatched to Cloud Task (BookingFail)");
    } catch (err) {
      console.error("❌ Failed to dispatch task (BookingFail):", err.message);
    }
  }
);

//-------------------------------------
// ✅ Export function: manually export from Firebase to BigQuery
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

exports.exportTable = onRequest({ region: "us-central1" }, async (req, res) => {
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

exports.exportTableTourDetailFrom = onRequest({ region: "us-central1" }, async (req, res) => {
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

exports.exportTableBookingFail = onRequest({ region: "us-central1" }, async (req, res) => {
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

exports.exportTableSearchOnMap = onRequest({ region: "us-central1" }, async (req, res) => {
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

exports.exportTableSessions = onRequest({ region: "us-central1" }, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).send('');

  try {
    const data = req.body.data;
    if (!data?.tableFrom || !data?.tableTo || !data?.startDate || !data?.endDate) {
      console.error("❌ [exportTableSessions] Thiếu tham số bắt buộc:", data);
      return res.status(400).json({ error: "Thiếu tham số bắt buộc." });
    }

    console.log("🚀 [exportTableSessions] Nhận yêu cầu export:", data);

    await doExportSessions(data);

    return res.json({
      data: {
        success: true,
        message: "✅ Server đã hoàn tất xử lý export Sessions!"
      }
    });
  } catch (err) {
    console.error("❌ [exportTableSessions] Lỗi xử lý exportTableSessions:", err.message);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});

// DELETE FROM `vietravel-app.tracking.book_tour_success` WHERE TRUE
// DELETE FROM `vietravel-app.tracking.usage_app`
// WHERE yearMonthDay < "2025-04-23"

// / todo chang code thì vào
// cd functions xóa log rồi npm install lại rồi quay về thư mục góc deploy

// --
//1: cd functions
//2: rm -rf node_modules package-lock.json
//3:  npm install
// 4: cd .. 
//5:  firebase deploy --only functions

// firebase functions:list


//todo Xem các functions
// https://console.cloud.google.com/run?authuser=0&hl=en&project=vietravel-app

/// xoá tất cả dử liệu ở các tatble

// TRUNCATE TABLE `vietravel-app.tracking.usage_app`;
// TRUNCATE TABLE `vietravel-app.tracking.sessions`;
// TRUNCATE TABLE `vietravel-app.tracking.event_click`;
// TRUNCATE TABLE `vietravel-app.tracking.search_keyword`;
// TRUNCATE TABLE `vietravel-app.tracking.search_destination`;
// TRUNCATE TABLE `vietravel-app.tracking.sign_in_account`;
// TRUNCATE TABLE `vietravel-app.tracking.screen_views`;
// TRUNCATE TABLE `vietravel-app.tracking.search_tour`;
// TRUNCATE TABLE `vietravel-app.tracking.search_combo`;
// TRUNCATE TABLE `vietravel-app.tracking.search_on_map`;
// TRUNCATE TABLE `vietravel-app.tracking.tour_detail_from`;
// TRUNCATE TABLE `vietravel-app.tracking.notification`;
// TRUNCATE TABLE `vietravel-app.tracking.book_tour_success`;
// TRUNCATE TABLE `vietravel-app.tracking.book_hotel_success`;
// TRUNCATE TABLE `vietravel-app.tracking.book_flight_success`;
// TRUNCATE TABLE `vietravel-app.tracking.book_hotel_flight_success`;
// TRUNCATE TABLE `vietravel-app.tracking.book_sight_seeing_success`;
// TRUNCATE TABLE `vietravel-app.tracking.book_tour_failed`;
// TRUNCATE TABLE `vietravel-app.tracking.book_hotel_failed`;
// TRUNCATE TABLE `vietravel-app.tracking.book_flight_failed`;
// TRUNCATE TABLE `vietravel-app.tracking.book_hotel_failed`;
// TRUNCATE TABLE `vietravel-app.tracking.test_tracking`;
// TRUNCATE TABLE `vietravel-app.tracking.map_search_category`;
// TRUNCATE TABLE `vietravel-app.tracking.map_detail`;
// TRUNCATE TABLE `vietravel-app.tracking.map_search_text`;

// todo export từ postman: thay function và tableFrom, tableTo, startDate,endDate
// https://us-central1-vietravel-app.cloudfunctions.net/exportTableSessions
// {
//   "data": {
//       "tableFrom": "Sessions",
//       "tableTo": "sessions",
//       "startDate": "2025-03-10",
//       "endDate": "2025-03-31"
//   }
// }
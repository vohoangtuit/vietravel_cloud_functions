// ✅ Cloud Function: Export Firebase Realtime Database to BigQuery (background mode)
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { BigQuery } = require("@google-cloud/bigquery");

admin.initializeApp();
const db = admin.database();
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
    console.log(`📆 Exporting date: ${date} - Table: ${tableFrom} -> ${tableTo}`);
    const snapshot = await db.ref(`Tracking/${tableFrom}/${date}`).once("value");
    const records = snapshot.val();
    if (!records) continue;

    const rows = [];
    for (const key of Object.keys(records)) {
      const record = {
        key,
        ...records[key],
        yearMonthDay: records[key].yearMonthDay || records[key].dayMonthYear || null,
      };
      delete record.dayMonthYear;

      Object.keys(record).forEach((f) => {
        if (record[f] === undefined) record[f] = null;
      });

      try {
        const [existing] = await bigquery.query({
          query: `SELECT key FROM \`${datasetId}.${tableTo}\` WHERE key = @key LIMIT 1`,
          params: { key: record.key },
        });

        if (existing.length === 0) {
          rows.push(record);
        }
      } catch (checkErr) {
        console.error(`❌ Error checking key ${record.key} on ${date}:`, checkErr.message);
      }
    }

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

    await doExport(data).catch((err) =>
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

// DELETE FROM `vietravel-app.tracking.book_tour_success` WHERE TRUE

// / todo chang code thì vào
// cd functions xóa log rồi npm install lại rồi quay về thư mục góc deploy

// --
//1: cd functions
//2: rm -rf node_modules package-lock.json
//3:  npm install
// 4: cd .. 
//5:  firebase deploy --only functions

// firebase functions:list
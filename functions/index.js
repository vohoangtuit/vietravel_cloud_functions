
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { BigQuery } = require("@google-cloud/bigquery");

// Khởi tạo Firebase Admin và BigQuery
admin.initializeApp();
const db = admin.database();
const bigquery = new BigQuery();

// Thiết lập cấu hình mặc định cho toàn bộ functions (region + timeout + memory nếu cần)
setGlobalOptions({ region: "us-central1" });

const datasetId = "tracking";

// ✅ Hàm export Gen 2 sử dụng `onRequest`
exports.exportTable = onRequest(async (req, res) => {
  try {
    const data = req.body;

    const tableName = data.tableId;
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (!tableName || !startDate || !endDate) {
      return res.status(400).json({ error: "Thiếu tham số bắt buộc." });
    }

    const dates = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      const isoDate = current.toISOString().split("T")[0];
      dates.push(isoDate);
      current.setDate(current.getDate() + 1);
    }

    let totalExported = 0;

    for (const date of dates) {
      const snapshot = await db.ref(`Tracking/${tableName}/${date}`).once("value");
      const data = snapshot.val();

      if (!data) continue;

      const rows = Object.keys(data).map((key) => ({
        date: date,
        key: key,
        ...data[key],
      }));

      try {
        await bigquery.dataset(datasetId).table(tableName).insert(rows);
        totalExported += rows.length;
        console.log(`✅ Exported ${rows.length} rows for ${date} in ${tableName}`);
      } catch (err) {
        console.error(`❌ Error exporting ${tableName} for ${date}`, err);
      }
    }

    return res.status(200).json({ success: true, totalExported });
  } catch (error) {
    console.error("❌ exportTable failed:", error);
    return res.status(500).json({ error: "Lỗi nội bộ khi export." });
  }
});

// const datasetId = "tracking"; // Dataset của bạn
//const tableId = "book_flight_success"; // Bảng đã tạo sẵn
// firebase login
// firebase deploy --only functions

// 1: export NVM_DIR="$HOME/.nvm"
// [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

// cd.. về thư mục trước
// cd functions
// rm package-lock.json
// rm -rf node_modules
// npm install
//  firebase deploy --only functions
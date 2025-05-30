import { onRequest } from "firebase-functions/v2/https";
import { onValueCreated } from "firebase-functions/v2/database";
import { setGlobalOptions } from "firebase-functions/v2";
import admin from "firebase-admin";
import { BigQuery } from "@google-cloud/bigquery";
import axios from "axios";
import { tableNameMap } from "./constants.js";
import db from "./firebase.js";
const bigquery = new BigQuery();
setGlobalOptions({ region: "us-central1", timeoutSeconds: 300 });

const datasetId = "tracking";
const batchSize = 500;

const urlInsert = `https://us-central1-vietravel-app.cloudfunctions.net/insertToBigQuery`;

  
 export const insertToBigQuery = onRequest(async (req, res) => {
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
  export const realtimeToBigQuery = onValueCreated(
    "/Tracking/{tableName}/{date}/{pushId}",
    async (event) => {
      const data = event.data.val();
      const key = event.data.key;
      const { tableName, date } = event.params;
      const dateObj = new Date(date);
      // if (isNaN(dateObj.getTime()) || dateObj < new Date("2025-05-01")) {

      //   return;
      // }
     
      const payload = {
        key,
        date,
        tableName,
        ...data
      };
     // console.log("📦 Payload gửi lên:", JSON.stringify(payload, null, 2));
      try {
        await axios.post(urlInsert, payload);
       // console.log("📤 Dispatched to Cloud Task (Realtime)");
      } catch (err) {
        console.error("❌ Failed to dispatch task (Realtime):", err.response?.data || err.message);
      }
    }
  );
  /// Sesstion thêm 1 cấo nữa nên làm riêng
  export const realtimeSession = onValueCreated(
    "/Tracking/Sessions/{date}/{userId}/{pushId}",
    async (event) => {
      const data = event.data.val();
      const key = event.data.key;
      const { date } = event.params;
      const dateObj = new Date(date);
      // if (isNaN(dateObj.getTime()) || dateObj < new Date("2025-05-01")) {
      //  // console.log("⏳ Bỏ qua realtimeBookingFaild vì chưa đến ngày 2025-05-01:", date);
      //   return;
      // }
  
  
      const payload = {
        key,
        date,
        tableName: "Sessions", // ✅ Gán cứng đúng tên
        ...data
      };
  
      try {
        await axios.post(urlInsert, payload);
      //  console.log("📤 Dispatched to Cloud Task (Sessions)");
      } catch (err) {
        console.error("❌ Failed to dispatch task (Sessions):", err.message);
      }
    }
  );
  /// SearchOnMap/CategoryOnMap path cấo nữa nên làm riêng
  export const realtimeMapCategory = onValueCreated(
    "/Tracking/SearchOnMap/CategoryOnMap/{date}/{pushId}",
    async (event) => {
      const data = event.data.val();
      const key = event.data.key;
      const { date } = event.params;
      const dateObj = new Date(date);
      // if (isNaN(dateObj.getTime()) || dateObj < new Date("2025-05-01")) {
      //   // console.log("⏳ Bỏ qua realtimeBookingFaild vì chưa đến ngày 2025-05-01:", date);
      //    return;
      //  }
     
      const payload = {
        key,
        date,
        tableName: "CategoryOnMap", // ✅ Gán cứng đúng tên
        ...data
      };
      try {
        await axios.post(urlInsert, payload);
      //  console.log("📤 Dispatched to Cloud Task (CategoryOnMap)");
      } catch (err) {
        console.error("❌ Failed to dispatch task (CategoryOnMap):", err.message);
      }
    }
  );
  /// SearchOnMap/CategoryOnMap path cấo nữa nên làm riêng
  export const realtimeMapDetail = onValueCreated(
    "/Tracking/SearchOnMap/DetailOnMap/{date}/{pushId}",
    async (event) => {
      const data = event.data.val();
      const key = event.data.key;
      const { date } = event.params;
      const dateObj = new Date(date);
      // if (isNaN(dateObj.getTime()) || dateObj < new Date("2025-05-01")) {
      //   // console.log("⏳ Bỏ qua realtimeBookingFaild vì chưa đến ngày 2025-05-01:", date);
      //    return;
      //  }
      
  
      const payload = {
        key,
        date,
        tableName: "DetailOnMap", // ✅ Gán cứng đúng tên
        ...data
      };
      try {
        await axios.post(urlInsert, payload);
      //  console.log("📤 Dispatched to Cloud Task (DetailOnMap)");
      } catch (err) {
        console.error("❌ Failed to dispatch task (DetailOnMap):", err.message);
      }
    }
  );
  /// SearchOnMap/TextOnMap path cấo nữa nên làm riêng
  export const realtimeTextOnMap = onValueCreated(
    "/Tracking/SearchOnMap/TextOnMap/{date}/{pushId}",
    async (event) => {
      const data = event.data.val();
      const key = event.data.key;
      const { date } = event.params;
      const dateObj = new Date(date);
      // if (isNaN(dateObj.getTime()) || dateObj < new Date("2025-05-01")) {
      //   // console.log("⏳ Bỏ qua realtimeBookingFaild vì chưa đến ngày 2025-05-01:", date);
      //    return;
      //  }
   
  
      const payload = {
        key,
        date,
        tableName: "TextOnMap", // ✅ Gán cứng đúng tên
        ...data
      };
      try {
        await axios.post(urlInsert, payload);
      //  console.log("📤 Dispatched to Cloud Task (DetailOnMap)");
      } catch (err) {
        console.error("❌ Failed to dispatch task (DetailOnMap):", err.message);
      }
    }
  );
  /// Booking Failed thêm 1 cấo nữa nên làm riêng
  export const realtimeBookingFaild = onValueCreated(
    "/Tracking/BookingFail/{tableName}/{date}/{pushId}",
    async (event) => {
      const data = event.data.val();
      const key = event.data.key;
      const { tableName, date } = event.params;
      const dateObj = new Date(date);
      // if (isNaN(dateObj.getTime()) || dateObj < new Date("2025-05-01")) {
      // //  console.log("⏳ Bỏ qua realtimeBookingFaild vì chưa đến ngày 2025-05-01:", date);
      //   return;
      // }
      
  
      const payload = {
        key,
        date,
        tableName,
        ...data
      };
  
     // console.log("🚨 Trigger realtimeBookingFaild:", payload);
  
      try {
        await axios.post(urlInsert, payload);
        //console.log("📤 Dispatched to Cloud Task (BookingFail)");
      } catch (err) {
        console.error("❌ Failed to dispatch task (BookingFail):", err.message);
      }
    }
  );

   /// Search Flights
  export const realtimeSearchFlights = onValueCreated(
    "/Tracking/SearchFlights/{date}/{pushId}",
    async (event) => {
      const data = event.data.val();
      const key = event.data.key;
      const { tableName, date } = event.params;
      
      const payload = {
        key,
        date,
        tableName,
        ...data
      };
  
      try {
        await axios.post(urlInsert, payload);
       // console.log("📤 Dispatched to Cloud Task (Realtime)");
      } catch (err) {
        console.error("❌ Failed to dispatch task (Realtime):", err.message);
      }
    }
  );

     /// Search Hotel
     export const realtimeSearchHotel = onValueCreated(
      "/Tracking/SearchHotel/{date}/{pushId}",
      async (event) => {
        const data = event.data.val();
        const key = event.data.key;
        const { tableName, date } = event.params;
        
        const payload = {
          key,
          date,
          tableName,
          ...data
        };
    
        try {
          await axios.post(urlInsert, payload);
         // console.log("📤 Dispatched to Cloud Task (Realtime)");
        } catch (err) {
          console.error("❌ Failed to dispatch task (Realtime):", err.message);
        }
      }
    );
    /// Search SightSeeing
    export const realtimeSearchSightSeeing = onValueCreated(
      "/Tracking/SearchSightSeeing/{date}/{pushId}",
      async (event) => {
        const data = event.data.val();
        const key = event.data.key;
        const { tableName, date } = event.params;
        
        const payload = {
          key,
          date,
          tableName,
          ...data
        };
    
        try {
          await axios.post(urlInsert, payload);
         // console.log("📤 Dispatched to Cloud Task (Realtime)");
        } catch (err) {
          console.error("❌ Failed to dispatch task (Realtime):", err.message);
        }
      }
    );
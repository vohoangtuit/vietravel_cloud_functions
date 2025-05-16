import {
  exportTable,
  exportTableSessions,
  exportTableBookingFail,
  exportTableTourDetailFrom,
  exportTableSearchOnMap,
} from "./exportFunctions.js";

import {
  insertToBigQuery,
  realtimeToBigQuery,
  realtimeSession,
  realtimeMapCategory,
  realtimeMapDetail,
  realtimeTextOnMap,
  realtimeBookingFaild,
  realtimeSearchFlights,
  realtimeSearchHotel,
  realtimeSearchSightSeeing
} from "./realtimeFunctions.js";

import { getUserTrends } from "./analyticsTrends.js";

import {getBookingSummary} from "./client/get_booking_suceess.js";

import {getSessions} from "./client/get_sessions.js";


// Xuất ra tất cả các hàm Cloud Functions để deploy
export {
  // exportTable,
  // exportTableSessions,
  // exportTableBookingFail,
  // exportTableTourDetailFrom,
  // exportTableSearchOnMap,
  insertToBigQuery,
  realtimeToBigQuery,
  realtimeSession,
  realtimeMapCategory,
  realtimeMapDetail,
  realtimeTextOnMap,
  realtimeBookingFaild,
  realtimeSearchFlights,
  realtimeSearchHotel,
  realtimeSearchSightSeeing,
  getUserTrends,
  getBookingSummary,
  getSessions
};

// ✅ Đã export data tới ngày 2025-04-28

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

// // ✅ Cloud Function: Export Firebase Realtime Database to BigQuery (GCF Gen 2 - firebase-functions v2 with Cloud Tasks)



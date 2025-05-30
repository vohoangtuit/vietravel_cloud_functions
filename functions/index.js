
//
import {answerTrackingQuery} from "./answer_tracking/answer.js";
export {
  answerTrackingQuery
};


//1: cd functions
//2: rm -rf node_modules package-lock.json
//3:  npm install
// 4: cd .. 
//5:  firebase deploy --only functions

// firebase deploy --only functions:answerTrackingQuery

// firebase functions:delete answerTrackingQueryV2
//-----

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

import {getBookingSummary,getBookTourFlow} from "./client/get_booking_suceess.js";

import {getSessions,getUserDemographics} from "./client/get_sessions.js";

import {getSearchKeywords} from "./client/get_keyword.js";

import {getSearchDestinations} from "./client/get_destination.js";

import {getScreenViews,getScreenViewDetail} from "./client/screen_views.js";

import {getEventClicks,getEventClickDetail} from "./client/event_click.js";


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
  getBookTourFlow,
  getSessions,
  getUserDemographics,
  getSearchKeywords,
  getScreenViews,
  getScreenViewDetail,
  getSearchDestinations,
  getEventClicks,
  getEventClickDetail
};

import {trainKeywordModel,scheduledTrainKeywordModel,predictPopularKeywords} from "./training/keyword.js";
export {
  trainKeywordModel,scheduledTrainKeywordModel,predictPopularKeywords
};


// firebase deploy --only functions:predictPopularKeywords,trainKeywordModel


// / todo chang code thì vào
// cd functions xóa log rồi npm install lại rồi quay về thư mục góc deploy

// --
//1: cd functions
//2: rm -rf node_modules package-lock.json
//3:  npm install
// 4: cd .. 
//5:  firebase deploy --only functions

// firebase deploy --only functions:realtimeToBigQuery



// https://us-central1-vietravel-app.cloudfunctions.net/predictPopularKeywords

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

// todo keyword
// todo: https://us-central1-vietravel-app.cloudfunctions.net/getUserTrends
// todo: https://us-central1-vietravel-app.cloudfunctions.net/predictPopularKeywords
// getUserTrends query thông thường, predictPopularKeywords dựa vào mô hình training dự đoán 


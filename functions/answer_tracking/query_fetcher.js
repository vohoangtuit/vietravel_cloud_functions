const date ='yearMonthDay';
// ✅ getUserQueries
export function getUserQueries({ fromDate, toDate }) {
  const params = { fromDate, toDate };
  return [
    {
      topic: "user",
      title: "👤 Số người dùng truy cập",
      type_data:"general",
      query: {
        query: `
          SELECT COUNT(DISTINCT customerCode) as total_users
          FROM \`tracking.sessions\`
          WHERE yearMonthDay BETWEEN @fromDate AND @toDate
        `,
        params
      }
    },
    {
      topic: "user",
      title: "📥 Số lượt đăng nhập",
      type_data:"general",
      query: {
        query: `
          SELECT COUNT(*) as total_signins
          FROM \`tracking.sign_in_account\`
          WHERE yearMonthDay BETWEEN @fromDate AND @toDate
        `,
        params
      }
    },
    {
      topic: "user",
      title: "📍 Vị trí truy cập nhiều nhất",
      type_data:"locationAccess",
      query: {
        query: `
          SELECT location, COUNT(*) as count
          FROM \`tracking.sessions\`
          WHERE yearMonthDay BETWEEN @fromDate AND @toDate
          GROUP BY location
          ORDER BY count DESC
          LIMIT 5
        `,
        params
      }
    },
    {
      topic: "user",
      title: "⏰ Khung giờ truy cập nhiều nhất",
      type_data:"timeAccess",
      query: {
        query: `
        SELECT 
        EXTRACT(HOUR FROM TIMESTAMP(timestamp1)) AS hour,
        COUNT(*) AS access_count
        FROM \`tracking.sessions\`
        WHERE timestamp1 IS NOT NULL AND timestamp1 != '' AND DATE(timestamp1) BETWEEN @fromDate AND @toDate
        GROUP BY hour
        ORDER BY access_count DESC
        LIMIT 3
        `,
        params
      }
    }
  ];
}

// ✅ getTourQueries
export function getTourQueries({ fromDate, toDate }) {
  const params = { fromDate, toDate };
  return [
    {
      topic: "tour",
      title: "📄 Tổng số booking tour",
      type_data:"general",
      query: {
        query: `
          SELECT COUNT(*) as total_bookings
          FROM \`tracking.book_tour_success\`
          WHERE yearMonthDay BETWEEN @fromDate AND @toDate
        `,
        params
      }
    },
    {
      topic: "tour",
      title: "💰 Doanh thu từ tour",
      type_data:"general",
      query: {
        query: `
          SELECT SUM(totalAmount) as total_revenue
          FROM \`tracking.book_tour_success\`
          WHERE yearMonthDay BETWEEN @fromDate AND @toDate
        `,
        params
      }
    },
    {
      topic: "tour",
      title: "📍 Điểm đến tìm kiếm nhiều nhất",
      type_data:"destinationSearch",
      query: {
        query: `
          SELECT id, ANY_VALUE(name) AS name, COUNT(*) as count
          FROM \`tracking.search_destination\`
          WHERE yearMonthDay BETWEEN @fromDate AND @toDate
          GROUP BY id
          ORDER BY count DESC
          LIMIT 5
        `,
        params
      }
    }
  ];
}

// ✅ getFlightQueries
export function getFlightQueries({ fromDate, toDate }) {
  const params = { fromDate, toDate };
  return [
    {
      topic: "flight",
      title: "📄 Tổng số booking vé máy bay",
      type_data:"general",
      query: {
        query: `
          SELECT COUNT(*) as total_bookings
          FROM \`tracking.book_flight_success\`
          WHERE yearMonthDay BETWEEN @fromDate AND @toDate
        `,
        params
      }
    },
    {
      topic: "flight",
      title: "💰 Doanh thu vé máy bay",
      type_data:"general",
      query: {
        query: `
          SELECT SUM(bookingPrice) as total_revenue
          FROM \`tracking.book_flight_success\`
          WHERE yearMonthDay BETWEEN @fromDate AND @toDate
        `,
        params
      }
    }
  ];
}

// ✅ getHotelQueries
export function getHotelQueries({ fromDate, toDate }) {
  const params = { fromDate, toDate };
  return [
    {
      topic: "hotel",
      title: "📄 Tổng số booking khách sạn",
      type_data:"general",
      query: {
        query: `
          SELECT COUNT(*) as total_bookings
          FROM \`tracking.book_hotel_success\`
          WHERE yearMonthDay BETWEEN @fromDate AND @toDate
        `,
        params
      }
    },
    {
      topic: "hotel",
      title: "💰 Doanh thu khách sạn",
      type_data:"general",
      query: {
        query: `
          SELECT SUM(bookingPrice) as total_revenue
          FROM \`tracking.book_hotel_success\`
          WHERE yearMonthDay BETWEEN @fromDate AND @toDate
        `,
        params
      }
    }
  ];
}

// ✅ getOverviewQueries
export function getOverviewQueries({ fromDate, toDate }) {
  return [
    ...getUserQueries({ fromDate, toDate }),
    ...getTourQueries({ fromDate, toDate }),
    ...getFlightQueries({ fromDate, toDate }),
    ...getHotelQueries({ fromDate, toDate })
  ];
}
  
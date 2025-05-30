const date ='yearMonthDay';
export function getUserQueries({ fromDate, toDate }) {
    return [
        {
            title: "Tổng số người dùng truy cập",
            query: `
              SELECT COUNT(DISTINCT userId) as total_users
              FROM \`tracking.sessions\`
              WHERE ${date} BETWEEN '${fromDate}' AND '${toDate}'
            `
          },
          {
            title: "Tổng số lượt đăng nhập",
            query: `
              SELECT COUNT(*) as total_signins
              FROM \`tracking.sign_in_account\`
              WHERE ${date} BETWEEN '${fromDate}' AND '${toDate}'
            `
          },
          {
            title: "Top 5 vị trí truy cập",
            query: `
              SELECT location, COUNT(*) as count
              FROM \`tracking.sessions\`
              WHERE ${date} BETWEEN '${fromDate}' AND '${toDate}'
              GROUP BY location
              ORDER BY count DESC
              LIMIT 5
            `
          },
          {
            title: "Top 5 khung giờ truy cập nhiều nhất",
            query: `
              SELECT 
                FORMAT_TIMESTAMP('%H', TIMESTAMP(timestamp1)) AS hour,
                COUNT(*) AS access_count
              FROM \`tracking.sessions\`
              WHERE ${date} BETWEEN '${fromDate}' AND '${toDate}'
              GROUP BY hour
              ORDER BY access_count DESC
              LIMIT 5
            `
          }
    ];
  }
  
  export function getTourQueries({ fromDate, toDate }) {
    return [
      {
        title: "Tổng số booking tour",
        query: `
          SELECT COUNT(*) as total_bookings
          FROM \`tracking.book_tour_success\`
          WHERE ${date} BETWEEN '${fromDate}' AND '${toDate}'
        `
      },
      {
        title: "Doanh thu từ tour",
        query: `
          SELECT SUM(totalAmount) as total_revenue
          FROM \`tracking.book_tour_success\`
          WHERE ${date} BETWEEN '${fromDate}' AND '${toDate}'
        `
      },
      {
        title: "Top 5 điểm đến được tìm kiếm nhiều nhất",
        query: `
          SELECT id,ANY_VALUE(name) AS name, COUNT(*) as count
          FROM \`tracking.search_destination\`
          WHERE ${date} BETWEEN '${fromDate}' AND '${toDate}'
          GROUP BY id
          ORDER BY count DESC
          LIMIT 5
        `
      }
    ];
  }
  
  export function getFlightQueries({ fromDate, toDate }) {
    return [
      {
        title: "Tổng số booking vé máy bay",
        query: `
          SELECT COUNT(*) as total_bookings
          FROM \`tracking.book_flight_success\`
          WHERE ${date} BETWEEN '${fromDate}' AND '${toDate}'
        `
      },
      {
        title: "Doanh thu vé máy bay",
        query: `
          SELECT SUM(bookingPrice) as total_revenue
          FROM \`tracking.book_flight_success\`
          WHERE ${date} BETWEEN '${fromDate}' AND '${toDate}'
        `
      }
    ];
  }
  
  export function getHotelQueries({ fromDate, toDate }) {
    return [
      {
        title: "Tổng số booking khách sạn",
        query: `
          SELECT COUNT(*) as total_bookings
          FROM \`tracking.book_hotel_success\`
          WHERE ${date} BETWEEN '${fromDate}' AND '${toDate}'
        `
      },
      {
        title: "Doanh thu khách sạn",
        query: `
          SELECT SUM(bookingPrice) as total_revenue
          FROM \`tracking.book_hotel_success\`
          WHERE ${date} BETWEEN '${fromDate}' AND '${toDate}'
        `
      }
    ];
  }
  
  export function getOverviewQueries({ fromDate, toDate }) {
    return [
      ...getUserQueries({ fromDate, toDate }),
      ...getTourQueries({ fromDate, toDate }),
      ...getFlightQueries({ fromDate, toDate }),
      ...getHotelQueries({ fromDate, toDate })
    ];
  }
  
# Ghi chú Cài đặt: Khởi tạo MongoDB Time Series

Đây là bước **bắt buộc** phải thực hiện thủ công **một lần duy nhất** để khởi tạo collection `results` cho tính năng giám sát.

Mongoose và `nuxt-mongoose` sẽ *sử dụng* collection này, nhưng chúng không tự động tạo nó với tùy chọn Time Series.

## Cách thực hiện (Dùng `mongosh` hoặc MongoDB Compass)

### 1. Kết nối và Chọn Database

Mở terminal (`mongosh`) hoặc MongoDB Compass và kết nối tới cơ sở dữ liệu của bạn.

Sau đó, chuyển sang đúng database mà dự án đang dùng (được khai báo trong `MONGODB_URI`):

```bash
# Thay 'headless-sentry-db' bằng tên database thực tế của bạn
use headless-sentry-db


OK, ý hay. Đây là nội dung cho file Markdown.

Bạn có thể lưu nó vào thư mục gốc của dự án với tên SETUP.md hoặc NOTES.md để tiện theo dõi.

Markdown

# Ghi chú Cài đặt: Khởi tạo MongoDB Time Series

Đây là bước **bắt buộc** phải thực hiện thủ công **một lần duy nhất** để khởi tạo collection `results` cho tính năng giám sát.

Mongoose và `nuxt-mongoose` sẽ *sử dụng* collection này, nhưng chúng không tự động tạo nó với tùy chọn Time Series.

## Cách thực hiện (Dùng `mongosh` hoặc MongoDB Compass)

### 1. Kết nối và Chọn Database

Mở terminal (`mongosh`) hoặc MongoDB Compass và kết nối tới cơ sở dữ liệu của bạn.

Sau đó, chuyển sang đúng database mà dự án đang dùng (được khai báo trong `MONGODB_URI`):

```bash
# Thay 'headless-sentry-db' bằng tên database thực tế của bạn
use headless-sentry-db
2. Chạy lệnh tạo Collection
Dán toàn bộ lệnh sau và nhấn Enter:

JavaScript

db.createCollection("results", {
   timeseries: {
      timeField: "timestamp",
      metaField: "meta",
      granularity: "minutes"
   }
})
Lệnh này làm gì?

Tạo collection tên là results.

Chỉ định nó là loại timeseries.

timeField: "timestamp": Báo cho Mongo biết trường nào là dấu thời gian chính.

metaField: "meta": Báo cho Mongo biết trường nào chứa metadata (dữ liệu mô tả, ít thay đổi) để tối ưu lưu trữ.

granularity: "minutes": Tối ưu việc lưu trữ cho dữ liệu được ghi vào theo từng phút.

3. Kiểm tra (Tùy chọn)
Để chắc chắn collection đã được tạo đúng, chạy lệnh:

JavaScript

db.getCollectionInfos({ name: "results" })
Bạn sẽ thấy trong phần options có type: "timeseries" nếu thành công.

JSON

[
  {
    "name": "results",
    "type": "timeseries", // <-- Đã đúng!
    "options": {
      "timeseries": {
        "timeField": "timestamp",
        "metaField": "meta",
        "granularity": "minutes"
      }
    },
    // ...
  }
]

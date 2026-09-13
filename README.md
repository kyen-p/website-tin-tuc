# HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY HỆ THỐNG TRÊN XAMPP


---

## BƯỚC 1: Khởi động môi trường XAMPP

---

## BƯỚC 2: Đặt thư mục mã nguồn vào thư mục `htdocs`
Kiểm tra lại đường dẫn chính xác trên máy tính đảm bảo như sau:
   - `C:\xampp\htdocs\website-tin-tuc\backend\`
   - `C:\xampp\htdocs\website-tin-tuc\frontend\`

---

## BƯỚC 3: Import Cơ sở dữ liệu mẫu 
> Tệp `machtin_db.sql` đã được tích hợp sẵn lệnh tự động khởi tạo cơ sở dữ liệu.

**Các bước thực hiện:**
1. Mở trình duyệt web và truy cập vào giao diện quản lý cơ sở dữ liệu:
   `http://localhost/phpmyadmin/`
2. Ngay tại **Trang chủ phpMyAdmin** không cần chọn hay tạo database nào trước.
3. Nhấp vào tab **Nhập** trên thanh menu ngang phía trên.
4. Tại mục **Tệp tin để nhập**:
   - Bấm nút **Chọn tệp**.
   - Điều hướng chọn đến tệp `machtin_db.sql` nằm trong thư mục dự án:
     `C:\xampp\htdocs\website-tin-tuc\backend\machtin_db.sql`
5. Cuộn xuống cuối trang và bấm nút **Nhập**.
6. Hệ thống sẽ tự động tạo cơ sở dữ liệu `machtin_db`, thiết lập toàn bộ bảng, khóa ngoại và nạp đầy đủ dữ liệu bài viết, chuyên mục, tài khoản mẫu.

---

## BƯỚC 4: Danh sách tài khoản đăng nhập mẫu
Danh sách tài khoản được trích xuất trực tiếp từ bảng `users` trong cơ sở dữ liệu mẫu (`machtin_db.sql`). Bạn có thể sử dụng **Tên đăng nhập (Username)** hoặc **Email** để đăng nhập vào hệ thống:

> **Ghi chú quan trọng:**
> - **Mật khẩu chung cho tất cả các tài khoản trên:** `12345678`
> - Độc giả cũng có thể tự tạo tài khoản mới bất kỳ lúc nào tại trang **Đăng ký**.
---

## BƯỚC 5: Các đường dẫn truy cập hệ thống trên trình duyệt
Sau khi hoàn tất việc nạp cơ sở dữ liệu, dán các đường dẫn sau vào thanh địa chỉ trình duyệt để bắt đầu trải nghiệm:

### 1. Dành cho tất cả độc giả (Công khai):
- **Trang chủ tin tức**:
  `http://localhost/website-tin-tuc/frontend/public/index.html`
- **Trang đăng nhập**:
  `http://localhost/website-tin-tuc/frontend/public/login.html`
- **Trang đăng ký**:
  `http://localhost/website-tin-tuc/frontend/public/register.html`
- **Trang tìm kiếm**:
  `http://localhost/website-tin-tuc/frontend/public/search.html`

### 2. Dành cho Quản trị viên:
- **Tổng quan quản trị (Dashboard)**:
  `http://localhost/website-tin-tuc/frontend/admin/dashboard.html`
- **Quản lý người dùng & phân quyền**:
  `http://localhost/website-tin-tuc/frontend/admin/users.html`
- **Quản lý bài viết đã xuất bản**:
  `http://localhost/website-tin-tuc/frontend/admin/published-articles.html`
- **Quản lý bình luận toàn hệ thống**:
  `http://localhost/website-tin-tuc/frontend/admin/comments.html`
- **Cấu hình thông tin tòa soạn**:
  `http://localhost/website-tin-tuc/frontend/admin/contact-config.html`

### 3. Dành cho Biên tập viên:
- **Tổng quan biên tập (Dashboard)**:
  `http://localhost/website-tin-tuc/frontend/editor/dashboard.html`
- **Duyệt bài viết chờ xuất bản**:
  `http://localhost/website-tin-tuc/frontend/editor/pending-articles.html`
- **Quản lý chuyên mục & thẻ tag**:
  `http://localhost/website-tin-tuc/frontend/editor/categories-tags.html`

### 4. Dành cho Phóng viên:
- **Tổng quan phóng viên (Dashboard)**:
  `http://localhost/website-tin-tuc/frontend/reporter/dashboard.html`
- **Soạn thảo và gửi duyệt bài viết mới**:
  `http://localhost/website-tin-tuc/frontend/reporter/write-article.html`
- **Quản lý bài viết của tôi**:
  `http://localhost/website-tin-tuc/frontend/reporter/my-articles.html`

### 5. Dành cho tất cả user:
- **Thông tin tài khoản**:
  `http://localhost/website-tin-tuc/frontend/user/profile.html`
- **Bài viết đã lưu yêu thích**:
  `http://localhost/website-tin-tuc/frontend/user/favorites.html`
- **Lịch sử bình luận của tôi**:
  `http://localhost/website-tin-tuc/frontend/user/my-comments.html`
- **Đổi mật khẩu**:
  `http://localhost/website-tin-tuc/frontend/user/change-password.html`

---

## CẤU TRÚC HỆ THỐNG DỰ ÁN

```text
website-tin-tuc/
|   README.md                                # Tài liệu hướng dẫn cài đặt, cấu hình môi trường và mô tả tổng quan hệ thống
|   
+---backend/
|   |   machtin_db.sql                       # File kịch bản SQL tự động khởi tạo database machtin_db, tạo bảng và nạp dữ liệu mẫu
|   |   
|   +---api/
|   |   |   upload.php                       # API tiếp nhận và lưu trữ tệp tin hình ảnh tải lên máy chủ (ảnh bài viết, avatar)
|   |   |   
|   |   +---admin/
|   |   |       comments.php                 # API quản trị viên quản lý, tra cứu và xóa bình luận độc giả trên toàn hệ thống
|   |   |       contact-config.php           # API quản trị viên đọc và cập nhật thông tin liên hệ chân trang tòa soạn
|   |   |       dashboard.php                # API tổng hợp số liệu thống kê tổng quan và biểu đồ tăng trưởng cho quản trị viên
|   |   |       published-articles.php       # API quản trị viên quản lý, chỉnh sửa, đổi chuyên mục hoặc gỡ bài viết đã xuất bản
|   |   |       users.php                    # API quản trị viên quản lý người dùng, phân quyền vai trò và khóa/mở khóa tài khoản
|   |   |       
|   |   +---auth/
|   |   |       login.php                    # API xác thực đăng nhập người dùng và khởi tạo phiên làm việc PHP Session
|   |   |       logout.php                   # API hủy bỏ phiên làm việc PHP Session và đăng xuất người dùng khỏi hệ thống
|   |   |       me.php                       # API lấy thông tin người dùng đang đăng nhập trong phiên làm việc hiện tại
|   |   |       register.php                 # API tiếp nhận thông tin đăng ký tài khoản độc giả mới vào hệ thống
|   |   |       
|   |   +---editor/
|   |   |       categories-tags.php          # API biên tập viên quản lý thêm, sửa, xóa danh mục chuyên mục và thẻ tag bài viết
|   |   |       dashboard.php                # API thống kê số lượng bài chờ duyệt và tỷ lệ phân bổ chuyên mục cho biên tập viên
|   |   |       pending-articles.php         # API biên tập viên xét duyệt xuất bản, trả bài về yêu cầu sửa hoặc từ chối bài viết
|   |   |       
|   |   +---public/
|   |   |       article-detail.php           # API công khai lấy chi tiết bài viết, tự động tăng lượt xem và lấy bài viết liên quan
|   |   |       articles.php                 # API công khai lấy danh sách bài viết đã xuất bản kèm lọc, tìm kiếm và phân trang
|   |   |       author.php                   # API công khai lấy thông tin tác giả và danh sách bài viết đã xuất bản của tác giả
|   |   |       categories.php               # API công khai lấy danh sách toàn bộ các chuyên mục bài viết đang hoạt động
|   |   |       comments.php                 # API công khai lấy danh sách bình luận đã được duyệt của một bài viết cụ thể
|   |   |       tags.php                     # API công khai lấy danh sách các thẻ tag bài viết phổ biến trên hệ thống
|   |   |       
|   |   +---reporter/
|   |   |       dashboard.php                # API thống kê số lượng bài viết theo từng trạng thái và tổng lượt đọc của riêng phóng viên
|   |   |       my-articles.php              # API phóng viên theo dõi danh sách, trạng thái kiểm duyệt và xóa bài viết của mình
|   |   |       write-article.php            # API phóng viên tạo mới hoặc cập nhật nội dung bài viết và gửi biên tập viên duyệt
|   |   |       
|   |   +---upload/
|   |   |   +---articles/                    # Các tệp hình ảnh bìa và hình ảnh minh họa được đính kèm trong bài viết
|   |   |   |              
|   |   |   \---avatars/                     # Các tệp hình ảnh đại diện do người dùng tải lên
|   |   |           
|   |   \---user/
|   |           change-password.php          # API người dùng tự thay đổi mật khẩu tài khoản cá nhân
|   |           favorites.php                # API người dùng quản lý thêm, xóa và lấy danh sách các bài viết đã lưu yêu thích
|   |           my-comments.php              # API người dùng tra cứu lịch sử bình luận cá nhân và tự xóa bình luận của mình
|   |           profile.php                  # API người dùng cập nhật thông tin cá nhân (họ tên, ảnh đại diện, tiểu sử)
|   |           
|   +---config/
|   |       database.php                     # Tệp cấu hình kết nối cơ sở dữ liệu MySQL qua đối tượng PDO PHP
|   |       
|   \---helpers/
|           auth.php                         # Các hàm trợ giúp kiểm tra trạng thái đăng nhập và kiểm tra quyền hạn vai trò người dùng
|           file.php                         # Các hàm trợ giúp kiểm tra định dạng, dung lượng và lưu trữ file ảnh tải lên
|           response.php                     # Các hàm trợ giúp chuẩn hóa dữ liệu phản hồi JSON và tính toán thông số phân trang
|           string.php                       # Các hàm trợ giúp chuyển đổi chuỗi tiêu đề tiếng Việt có dấu thành slug URL chuẩn
|           
\---frontend/
    +---admin/
    |       comments.html                    # Giao diện trang quản trị viên quản lý, tìm kiếm và kiểm duyệt bình luận
    |       contact-config.html              # Giao diện trang quản trị viên cấu hình thông tin liên hệ và tòa soạn
    |       dashboard.html                   # Giao diện bảng điều khiển tổng quan số liệu thống kê dành cho quản trị viên
    |       published-articles.html          # Giao diện trang quản trị viên theo dõi và xử lý các bài viết đã xuất bản
    |       users.html                       # Giao diện trang quản trị viên quản lý danh sách người dùng và phân quyền tài khoản
    |       
    +---assets/
    |   +---css/
    |   |       admin-layout.css             # Bảng kiểu CSS định dạng khung sườn bảng quản trị (Sidebar, Header, Table, Modal)
    |   |       auth.css                     # Bảng kiểu CSS định dạng các trang xác thực tài khoản (Đăng nhập, Đăng ký)
    |   |       base.css                     # Bảng kiểu CSS định nghĩa biến màu sắc, kiểu chữ và các lớp tiện ích cơ sở toàn hệ thống
    |   |       public-layout.css            # Bảng kiểu CSS định dạng khung sườn trang công khai (Header, Chân trang, Cột bên)
    |   |       public.css                   # Bảng kiểu CSS định dạng lưới bài viết, thẻ tin tức và các thành phần giao diện công khai
    |   |       
    |   \---js/
    |           admin-comments.js            # Xử lý logic hiển thị bảng bình luận, lọc theo bài viết, tìm kiếm và xóa bình luận
    |           admin-contact-config.js      # Xử lý tải thông tin liên hệ và lưu biểu mẫu cấu hình tòa soạn
    |           admin-dashboard.js           # Xử lý hiển thị các thẻ số liệu thống kê và biểu đồ hoạt động trong bảng điều khiển admin
    |           admin-layout.js              # Xử lý khung điều hướng quản trị, phân quyền hiển thị menu và chức năng đăng xuất
    |           admin-published-articles.js  # Xử lý hiển thị bảng bài viết đã xuất bản, gỡ bài và cập nhật chuyên mục nhanh
    |           admin-users-modal.js         # Xử lý logic các hộp thoại Modal phân quyền vai trò và khóa tài khoản người dùng
    |           admin-users.js               # Xử lý hiển thị danh sách người dùng, tìm kiếm, lọc theo vai trò và kích hoạt phân quyền
    |           article-detail.js            # Xử lý hiển thị chi tiết bài viết, lưu bài yêu thích, gửi và xóa bình luận
    |           author.js                    # Xử lý hiển thị hồ sơ tác giả và danh sách các bài viết đã xuất bản của tác giả
    |           category.js                  # Xử lý hiển thị bài viết tiêu điểm, danh sách bài theo chuyên mục và phân trang số
    |           change-password.js           # Xử lý kiểm tra hợp lệ biểu mẫu và gửi yêu cầu đổi mật khẩu tài khoản
    |           ckeditor-helper.js           # Trợ giúp khởi tạo và cấu hình trình soạn thảo văn bản phong phú CKEditor 5
    |           common.js                    # Thư viện tiện ích dùng chung (Gọi API an toàn, định dạng ngày tháng, Toast, Avatar)
    |           editor-categories-tags.js    # Xử lý hiển thị danh sách, thêm, sửa và xóa chuyên mục và thẻ tag bài viết
    |           editor-dashboard.js          # Xử lý hiển thị số liệu bài viết chờ duyệt và biểu đồ phân bổ chuyên mục của biên tập viên
    |           editor-pending-articles-modal.js # Xử lý các hộp thoại Modal duyệt bài, trả bài về sửa và từ chối bài viết
    |           editor-pending-articles.js   # Xử lý bảng bài viết chờ duyệt, bộ lọc chuyên mục và gọi hộp thoại kiểm duyệt
    |           favorites.js                 # Xử lý hiển thị danh sách bài viết yêu thích của độc giả và thao tác xóa khỏi mục lưu
    |           home.js                      # Xử lý hiển thị trang chủ (Tin nổi bật, tin mới nhất, đọc nhiều nhất, theo chuyên mục)
    |           login.js                     # Xử lý kiểm tra hợp lệ thông tin đăng nhập và gửi yêu cầu xác thực tới máy chủ
    |           my-comments.js               # Xử lý hiển thị lịch sử bình luận của người dùng và thao tác xóa bình luận
    |           profile.js                   # Xử lý hiển thị thông tin hồ sơ, tải ảnh đại diện lên máy chủ và lưu cập nhật cá nhân
    |           register.js                  # Xử lý kiểm tra hợp lệ thông tin đăng ký tài khoản độc giả mới
    |           reporter-dashboard.js        # Xử lý hiển thị số liệu thống kê bài viết và tổng lượt đọc của riêng phóng viên
    |           reporter-my-articles.js      # Xử lý bảng bài viết cá nhân của phóng viên, lọc theo trạng thái và xóa bài nháp
    |           reporter-write-article.js    # Xử lý biểu mẫu soạn bài, tải ảnh bìa, nhúng CKEditor và gửi bài viết chờ duyệt
    |           search.js                    # Xử lý tìm kiếm bài viết theo từ khóa, lọc theo chuyên mục, sắp xếp và phân trang
    |           
    +---editor/
    |       categories-tags.html             # Giao diện trang biên tập viên quản lý các chuyên mục và thẻ tag bài viết
    |       dashboard.html                   # Giao diện bảng điều khiển thống kê số liệu bài chờ duyệt của biên tập viên
    |       pending-articles.html            # Giao diện trang biên tập viên kiểm duyệt các bài viết do phóng viên gửi lên
    |       
    +---public/
    |       article-detail.html              # Giao diện trang chi tiết bài viết tin tức và khu vực bình luận của độc giả
    |       author.html                      # Giao diện trang hồ sơ công khai của tác giả và danh sách bài viết của họ
    |       category.html                    # Giao diện trang danh sách bài viết theo từng chuyên mục tin tức kèm bài tiêu điểm
    |       index.html                       # Giao diện trang chủ tin tức tổng hợp Mạch Tin
    |       login.html                       # Giao diện trang đăng nhập tài khoản người dùng
    |       register.html                    # Giao diện trang đăng ký tài khoản độc giả mới
    |       search.html                      # Giao diện trang tìm kiếm bài viết theo từ khóa kèm bộ lọc chuyên sâu
    |       
    +---reporter/
    |       dashboard.html                   # Giao diện bảng điều khiển thống kê bài viết và tương tác của phóng viên
    |       my-articles.html                 # Giao diện trang phóng viên theo dõi và quản lý các bài viết của chính mình
    |       write-article.html               # Giao diện trang phóng viên soạn thảo và gửi bài viết mới hoặc chỉnh sửa bài
    |       
    \---user/
            change-password.html             # Giao diện trang đổi mật khẩu tài khoản cá nhân của độc giả
            favorites.html                   # Giao diện trang danh sách các bài viết đã lưu yêu thích của độc giả
            my-comments.html                 # Giao diện trang tra cứu lịch sử các bài bình luận của độc giả
            profile.html                     # Giao diện trang xem và chỉnh sửa thông tin hồ sơ cá nhân của độc giả
```

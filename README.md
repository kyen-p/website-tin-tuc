```text
website-tin-tuc:.
+---backend
|   |   machtin_db.sql                      # Script tạo cấu trúc bảng và dữ liệu mẫu ban đầu cho CSDL MySQL
|   |   
|   +---api
|   |   |   upload.php                      # API upload file/hình ảnh từ máy lên server lưu trữ
|   |   |   
|   |   +---admin
|   |   |       comments.php                # API quản lý và kiểm duyệt toàn bộ bình luận trong hệ thống cho Admin
|   |   |       contact-config.php          # API xem và cập nhật thông tin liên hệ/cấu hình tòa soạn
|   |   |       published-articles.php      # API quản lý, tìm kiếm và chỉnh sửa các bài viết đã xuất bản
|   |   |       users.php                   # API phân quyền, khóa/mở và quản lý tài khoản người dùng
|   |   |       
|   |   +---auth
|   |   |       login.php                   # API xác thực đăng nhập tài khoản và cấp phiên làm việc (session)
|   |   |       logout.php                  # API hủy phiên đăng nhập và đăng xuất khỏi hệ thống
|   |   |       me.php                      # API kiểm tra trạng thái và lấy thông tin người dùng hiện tại đang đăng nhập
|   |   |       register.php                # API đăng ký tài khoản độc giả mới vào hệ thống
|   |   |       
|   |   +---editor
|   |   |       categories-tags.php         # API thêm, sửa, xóa danh mục bài viết và thẻ tag cho Biên tập viên
|   |   |       dashboard.php               # API thống kê tổng quan tiến độ duyệt bài cho Biên tập viên
|   |   |       pending-articles.php        # API duyệt xuất bản hoặc từ chối kèm lý do bài viết chờ duyệt
|   |   |       
|   |   +---public
|   |   |       article-detail.php          # API lấy nội dung chi tiết bài viết, tác giả và danh sách thẻ liên quan
|   |   |       articles.php                # API lấy danh sách bài viết trang chủ, tin mới và tin nổi bật
|   |   |       author.php                  # API lấy thông tin tiểu sử và danh sách bài viết theo tác giả
|   |   |       categories.php              # API lấy danh sách bài viết thuộc về một danh mục cụ thể
|   |   |       comments.php                # API lấy danh sách và gửi bình luận bài viết cho độc giả
|   |   |       tags.php                    # API lấy danh sách bài viết gắn theo một thẻ tag cụ thể
|   |   |       
|   |   +---reporter
|   |   |       dashboard.php               # API thống kê số lượng bài viết và trạng thái duyệt cho Phóng viên
|   |   |       my-articles.php             # API danh sách, xem chi tiết và xóa bài viết của chính Phóng viên
|   |   |       write-article.php           # API tạo bài viết mới hoặc lưu bản nháp của Phóng viên
|   |   |       
|   |   +---upload
|   |   |   +---articles
|   |   |   |       .gitkeep                # File giữ thư mục lưu ảnh bìa và ảnh nội dung bài viết
|   |   |   |           
|   |   |   \---avatars
|   |   |           .gitkeep                # File giữ thư mục lưu ảnh đại diện (avatar) của người dùng
|   |   |                    
|   |   \---user
|   |           change-password.php         # API đổi mật khẩu tài khoản người dùng
|   |           favorites.php               # API lưu bài viết yêu thích và xem danh sách
|   |           my-comments.php             # API lấy lịch sử các bình luận cá nhân của người dùng
|   |           profile.php                 # API xem và cập nhật thông tin cá nhân (họ tên, email, avatar, username)
|   |           
|   +---config
|   |       database.php                    # Cấu hình chuỗi kết nối cơ sở dữ liệu PDO MySQL
|   |       
|   \---helpers
|           auth.php                        # Hàm tiện ích kiểm tra đăng nhập và phân quyền (RBAC)
|           file.php                        # Hàm tiện ích xử lý kiểm tra định dạng và upload file an toàn
|           response.php                    # Hàm tiện ích chuẩn hóa phản hồi JSON (thành công/thất bại) cho API
|           string.php                      # Hàm tiện ích xử lý chuỗi, tạo slug URL và làm sạch dữ liệu
|           
\---frontend
    +---admin
    |       comments.html                   # Giao diện quản lý và kiểm duyệt danh sách bình luận cho Admin
    |       contact-config.html             # Giao diện quản lý thông tin liên hệ và cấu hình hệ thống cho Admin
    |       dashboard.html                  # Giao diện bảng điều khiển thống kê tổng thể toàn hệ thống cho Admin
    |       published-articles.html         # Giao diện quản lý và biên tập các bài viết đã xuất bản cho Admin
    |       users.html                      # Giao diện quản trị danh sách người dùng và phân quyền cho Admin
    |       
    +---assets
    |   +---css
    |   |       admin-layout.css            # Định kiểu giao diện quản trị (sidebar, header, form, bảng) cho Admin/Editor/Reporter
    |   |       auth.css                    # Định kiểu giao diện trang đăng nhập và đăng ký
    |   |       base.css                    # Định kiểu cốt lõi toàn hệ thống: reset CSS, biến màu sắc, typography và siêu văn bản
    |   |       public-layout.css           # Định kiểu khung trang công khai: header điều hướng, menu chuyên mục, footer
    |   |       public.css                  # Định kiểu các thành phần trang công khai: card tin tức, lưới bài viết, bình luận
    |   |       
    |   \---js
    |           admin-comments.js           # Xử lý lọc, duyệt và xóa bình luận trong trang quản trị bình luận
    |           admin-contact-config.js     # Xử lý tải và lưu thông tin liên hệ của tòa soạn
    |           admin-dashboard.js          # Xử lý nạp dữ liệu số liệu biểu đồ và thống kê tổng thể cho Admin
    |           admin-layout.js             # Xử lý thanh điều hướng, menu tài khoản và đăng xuất trong trang quản trị
    |           admin-published-articles.js # Xử lý danh sách bài viết đã xuất bản và gọi modal biên tập nhanh của Admin
    |           admin-users-modal.js        # Xử lý modal thêm mới, chỉnh sửa thông tin và phân quyền người dùng
    |           admin-users.js              # Xử lý tải danh sách, lọc và khóa tài khoản người dùng cho Admin
    |           article-detail.js           # Xử lý hiển thị nội dung chi tiết bài viết, lưu yêu thích và gửi bình luận
    |           author.js                   # Xử lý hiển thị trang hồ sơ và danh sách bài viết của tác giả
    |           category.js                 # Xử lý hiển thị danh sách bài viết phân trang theo chuyên mục
    |           change-password.js          # Xử lý form kiểm tra và gửi yêu cầu đổi mật khẩu tài khoản
    |           ckeditor-helper.js          # Module khởi tạo và cấu hình dùng chung cho trình soạn thảo CKEditor 5
    |           common.js                   # Thư viện hàm dùng chung toàn frontend (xử lý API URL, ngày tháng, thông báo toast)
    |           editor-categories-tags.js   # Xử lý giao diện quản lý CRUD danh mục và thẻ tag cho Biên tập viên
    |           editor-dashboard.js         # Xử lý nạp dữ liệu thống kê số lượng bài chờ duyệt cho Biên tập viên
    |           editor-pending-articles-modal.js # Xử lý modal đọc toàn văn bài viết và form gửi lý do từ chối/duyệt bài
    |           editor-pending-articles.js  # Xử lý danh sách bài viết chờ duyệt phân trang cho Biên tập viên
    |           favorites.js                # Xử lý nạp và xóa bài viết trong danh sách yêu thích của độc giả
    |           home.js                     # Xử lý nạp dữ liệu tin tiêu điểm, tin mới và khối bài viết trang chủ
    |           login.js                    # Xử lý kiểm tra dữ liệu và gửi yêu cầu đăng nhập của người dùng
    |           my-comments.js              # Xử lý nạp danh sách lịch sử các bình luận đã đăng của người dùng
    |           profile.js                  # Xử lý nạp thông tin cá nhân và cập nhật hồ sơ người dùng
    |           register.js                 # Xử lý kiểm tra dữ liệu và gửi yêu cầu đăng ký tài khoản mới
    |           reporter-dashboard.js       # Xử lý nạp dữ liệu biểu đồ và số liệu bài viết cá nhân của Phóng viên
    |           reporter-my-articles.js     # Xử lý danh sách bài viết theo trạng thái (nháp, chờ duyệt, từ chối) của Phóng viên
    |           reporter-write-article.js   # Xử lý form soạn bài viết, tích hợp CKEditor 5 và gửi duyệt/lưu nháp
    |           search.js                   # Xử lý tìm kiếm bài viết theo từ khóa và hiển thị kết quả phân trang
    |           
    +---editor
    |       categories-tags.html            # Giao diện quản lý danh mục và thẻ tag bài viết cho Biên tập viên
    |       dashboard.html                  # Giao diện bảng điều khiển thống kê duyệt bài cho Biên tập viên
    |       pending-articles.html           # Giao diện duyệt hoặc từ chối bài viết chờ thẩm định cho Biên tập viên
    |       
    +---public
    |       article-detail.html             # Giao diện đọc chi tiết nội dung bài viết và phần bình luận cho độc giả
    |       author.html                     # Giao diện xem hồ sơ tác giả và các bài viết đã xuất bản của tác giả
    |       category.html                   # Giao diện duyệt tin tức theo từng chuyên mục cho độc giả
    |       index.html                      # Giao diện trang chủ tin tức tổng hợp
    |       login.html                      # Giao diện trang đăng nhập tài khoản
    |       register.html                   # Giao diện trang đăng ký tài khoản mới
    |       search.html                     # Giao diện trang tìm kiếm tin tức cho độc giả
    |       
    +---reporter
    |       dashboard.html                  # Giao diện bảng điều khiển thống kê cá nhân cho Phóng viên
    |       my-articles.html                # Giao diện quản lý các bài viết cá nhân của Phóng viên
    |       write-article.html              # Giao diện soạn thảo và gửi duyệt bài viết mới cho Phóng viên
    |       
    \---user
            change-password.html            # Giao diện đổi mật khẩu tài khoản người dùng
            favorites.html                  # Giao diện danh sách bài viết đã lưu yêu thích của người dùng
            my-comments.html                # Giao diện danh sách các bình luận đã gửi của người dùng
            profile.html                    # Giao diện thông tin tài khoản và cập nhật hồ sơ cá nhân
```

# HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY HỆ THỐNG TRÊN XAMPP
## BƯỚC 1: Khởi động môi trường XAMPP
## BƯỚC 2: Đặt thư mục mã nguồn vào htdocs
Bỏ toàn bộ thư mục dự án vào. 
Kiểm tra cấu trúc thư mục đảm bảo đường dẫn như sau:

C:\xampp\htdocs\website-tin-tuc\backend\

C:\xampp\htdocs\website-tin-tuc\frontend\

## BƯỚC 3: Tạo Cơ sở dữ liệu và Import dữ liệu mẫu
Mở trình duyệt web và truy cập vào địa chỉ: `http://localhost/phpmyadmin/`. Bấm tạo database:

Tên cơ sở dữ liệu: machtin_db

Bảng mã: Chọn utf8mb4_unicode_ci

Sau khi tạo xong, chọn vào database machtin_db ở danh sách bên trái.

Bấm vào tab Nhập ở thanh menu phía trên:

Chọn tệp: Bấm chọn đến file machtin_db.sql nằm trong thư mục dự án
## BƯỚC 4: Danh sách tài khoản đăng nhập mẫu
Mật khẩu chung cho tất cả tài khoản trong hệ thống: 12345678
## BƯỚC 5: Các đường dẫn truy cập hệ thống trên trình duyệt
Sau khi hoàn tất các bước trên, bạn có thể dán đường dẫn sau vào thanh địa chỉ trình duyệt để bắt đầu trải nghiệm:

Trang chủ:
`http://localhost/website-tin-tuc/frontend/public/index.html`

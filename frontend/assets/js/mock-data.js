/**
 * ==============================================================================
 * MẠCH TIN - MOCK DATA (Dữ liệu mẫu chuẩn hóa 1-1 với Database)
 * ==============================================================================
 * Cấu trúc dữ liệu mô phỏng chính xác với thiết kế Database MySQL / PostgreSQL:
 * - Mỗi thuộc tính là 1 bảng (table)
 * - Mỗi phần tử là 1 bản ghi (record)
 * - Khóa chính: id (INT)
 * - Khóa ngoại: author_id, category_id, user_id, article_id, topic_id, tag_id,...
 * - Thời gian giả lập hiện tại của hệ thống: 13/08/2026 12:00:00
 * ==============================================================================
 */

const MOCK_DATA = {
  // ============================================================================
  // 1. BẢNG CẤU HÌNH HỆ THỐNG (site_settings)
  // ============================================================================
  site_settings: {
    name: "Mạch Tin",
    logo: "/assets/images/logo.png",
    contact_email: "lienhe@machtin.vn",
    contact_phone: "028 1234 5678",
    address: "02 Võ Oanh, phường Thạnh Mỹ Tây, TP. Hồ Chí Minh",
    short_description: "Bắt mạch dòng chảy tin tức Việt Nam - cập nhật liên tục, xác thực trước khi đăng.",
    social_links: {
      facebook: "https://facebook.com/machtin",
      youtube: "https://youtube.com/machtin",
      tiktok: "https://tiktok.com/machtin"
    }
  },

  // ============================================================================
  // 2. BẢNG NGƯỜI DÙNG (users)
  // Mật khẩu demo chung: 12345678
  // Role: 'user' (độc giả), 'reporter' (phóng viên), 'editor' (biên tập viên), 'admin' (quản trị viên)
  // ============================================================================
  users: [
    // 4 độc giả (role: 'user')
    {
      id: 1,
      username: "hoangnam",
      email: "hoangnam@gmail.com",
      password: "12345678",
      full_name: "Hoàng Nam",
      avatar: "/assets/images/avatar-1.png",
      bio: "Kỹ sư phần mềm, đam mê công nghệ và kinh tế số.",
      role: "user",
      status: "active",
      comment_locked: false,
      created_at: "2026-06-01 08:00:00"
    },
    {
      id: 2,
      username: "thutrang",
      email: "thutrang@gmail.com",
      password: "12345678",
      full_name: "Trần Thu Trang",
      avatar: "/assets/images/avatar-2.png",
      bio: "Giáo viên ngữ văn, quan tâm các vấn đề xã hội và giáo dục hiện đại.",
      role: "user",
      status: "active",
      comment_locked: true,
      created_at: "2026-06-15 09:30:00"
    },
    {
      id: 3,
      username: "quochuy",
      email: "quochuy@gmail.com",
      password: "12345678",
      full_name: "Nguyễn Quốc Huy",
      avatar: "/assets/images/avatar-3.png",
      bio: "Yêu thích thể thao trong nước và quốc tế, theo dõi sát các giải đấu đỉnh cao.",
      role: "user",
      status: "active",
      comment_locked: false,
      created_at: "2026-07-01 14:20:00"
    },
    {
      id: 4,
      username: "baongoc",
      email: "baongoc@gmail.com",
      password: "12345678",
      full_name: "Phạm Bảo Ngọc",
      avatar: "/assets/images/avatar-4.png",
      bio: "Độc giả tự do sinh sống tại TP. Hồ Chí Minh.",
      role: "user",
      status: "locked",
      lock_reason: "Vi phạm quy định bình luận (spam quảng cáo nhiều lần)",
      locked_at: "2026-08-11 11:00:00",
      comment_locked: false,
      created_at: "2026-07-10 10:00:00"
    },

    // 2 phóng viên (role: 'reporter')
    {
      id: 5,
      username: "thanhngan",
      email: "thanhngan@machtin.vn",
      password: "12345678",
      full_name: "Thanh Ngân",
      avatar: "/assets/images/avatar-5.png",
      bio: "Phóng viên phụ trách mảng Công nghệ, Giáo dục và Thể thao của Mạch Tin.",
      role: "reporter",
      status: "active",
      comment_locked: false,
      created_at: "2026-05-01 08:00:00"
    },
    {
      id: 6,
      username: "minhphuong",
      email: "minhphuong@machtin.vn",
      password: "12345678",
      full_name: "Minh Phương",
      avatar: "/assets/images/avatar-6.png",
      bio: "Phóng viên điều tra mảng Thời sự, Kinh tế và Đời sống đô thị.",
      role: "reporter",
      status: "active",
      comment_locked: false,
      created_at: "2026-05-05 08:00:00"
    },

    // 1 biên tập viên (role: 'editor')
    {
      id: 7,
      username: "tuankiet",
      email: "tuankiet@machtin.vn",
      password: "12345678",
      full_name: "Lê Tuấn Kiệt",
      avatar: "/assets/images/avatar-7.png",
      bio: "Biên tập viên trưởng ban Nội dung và Thời sự của Mạch Tin.",
      role: "editor",
      status: "active",
      comment_locked: false,
      created_at: "2026-04-01 08:00:00"
    },

    // 1 quản trị viên (role: 'admin')
    {
      id: 8,
      username: "dinhtrong",
      email: "dinhtrong@machtin.vn",
      password: "12345678",
      full_name: "Nguyễn Đình Trọng",
      avatar: "/assets/images/avatar-8.png",
      bio: "Quản trị viên kỹ thuật và vận hành hệ thống tòa soạn Mạch Tin.",
      role: "admin",
      status: "active",
      comment_locked: false,
      created_at: "2026-01-01 00:00:00"
    }
  ],

  // ============================================================================
  // 3. BẢNG CHUYÊN MỤC (categories)
  // ============================================================================
  categories: [
    {
      id: 1,
      name: "Thời sự",
      slug: "thoi-su",
      description: "Tin tức thời sự, chính trị, kinh tế xã hội và sự kiện trong nước nóng hổi 24/7.",
      created_at: "2026-01-01 00:00:00"
    },
    {
      id: 2,
      name: "Công nghệ",
      slug: "cong-nghe",
      description: "Trí tuệ nhân tạo (AI), chuyển đổi số, thiết bị thông minh và xu hướng công nghệ tương lai.",
      created_at: "2026-01-01 00:00:00"
    },
    {
      id: 3,
      name: "Thể thao",
      slug: "the-thao",
      description: "Tin tức thể thao trong nước và quốc tế, bóng đá, SEA Games và các giải đấu đỉnh cao.",
      created_at: "2026-01-01 00:00:00"
    },
    {
      id: 4,
      name: "Giải trí",
      slug: "giai-tri",
      description: "Phim ảnh, âm nhạc, nghệ thuật, văn hóa và đời sống người nổi tiếng.",
      created_at: "2026-01-01 00:00:00"
    },
    {
      id: 5,
      name: "Đời sống",
      slug: "doi-song",
      description: "Câu chuyện gia đình, phong cách sống, ẩm thực, du lịch và nhịp sống đô thị.",
      created_at: "2026-01-01 00:00:00"
    },
    {
      id: 6,
      name: "Giáo dục",
      slug: "giao-duc",
      description: "Thông tin tuyển sinh, đổi mới giáo dục, đào tạo đại học và học bổng du học.",
      created_at: "2026-01-01 00:00:00"
    }
  ],

  // ============================================================================
  // 4. BẢNG THẺ TỪ KHÓA (tags)
  // ============================================================================
  tags: [
    { id: 1, name: "AI", slug: "ai", created_at: "2026-01-01 00:00:00" },
    { id: 2, name: "Giá vàng", slug: "gia-vang", created_at: "2026-01-01 00:00:00" },
    { id: 3, name: "SEA Games", slug: "sea-games", created_at: "2026-01-01 00:00:00" },
    { id: 4, name: "Chuyển đổi số", slug: "chuyen-doi-so", created_at: "2026-01-01 00:00:00" },
    { id: 5, name: "Giáo dục", slug: "giao-duc", created_at: "2026-01-01 00:00:00" },
    { id: 6, name: "Thị trường", slug: "thi-truong", created_at: "2026-01-01 00:00:00" },
    { id: 7, name: "Phim Việt", slug: "phim-viet", created_at: "2026-01-01 00:00:00" },
    { id: 8, name: "Đô thị", slug: "do-thi", created_at: "2026-01-01 00:00:00" },
    { id: 9, name: "Giao thông xanh", slug: "giao-thong-xanh", created_at: "2026-01-01 00:00:00" },
    { id: 10, name: "Khởi nghiệp", slug: "khoi-nghiep", created_at: "2026-01-01 00:00:00" },
    { id: 11, name: "Sức khỏe", slug: "suc-khoe", created_at: "2026-01-01 00:00:00" },
    { id: 12, name: "Du lịch", slug: "du-lich", created_at: "2026-01-01 00:00:00" }
  ],

  // ============================================================================
  // 5. BẢNG BÀI VIẾT (articles)
  // Status: 'draft' (nháp), 'pending' (chờ duyệt), 'published' (đã đăng), 'rejected' (từ chối)
  // ============================================================================
  articles: [
    {
      id: 1,
      title: "Giá vàng trong nước lập đỉnh mới",
      slug: "gia-vang-trong-nuoc-lap-dinh-moi",
      short_description: "Giá vàng miếng sáng nay vượt mọi dự báo của chuyên gia kinh tế, chạm mốc kỷ lục mới.",
      content: "Giá vàng trong nước sáng nay tiếp tục ghi nhận đợt tăng phi mã chưa từng có. Theo ghi nhận tại các thương hiệu vàng lớn, giá vàng miếng SJC đã vượt ngưỡng lịch sử trong sự ngỡ ngàng của giới đầu tư.\n\nCác chuyên gia kinh tế nhận định nguyên nhân chủ yếu đến từ sự biến động của giá vàng thế giới kết hợp với tâm lý tích trữ của người dân. Ngân hàng Nhà nước khuyến cáo người dân cần hết sức thận trọng trước các đợt biến động ngắn hạn.",
      cover_image: "/assets/images/bai-2.jpg",
      author_id: 6,
      approved_by: 7,
      category_id: 1,
      topic_id: null,
      is_notable_event: true,
      status: "published",
      rejection_reason: null,
      view_count: 850,
      published_at: "2026-08-13 10:00:00",
      created_at: "2026-08-13 09:00:00",
      updated_at: "2026-08-13 10:00:00"
    },
    {
      id: 2,
      title: "Đội tuyển Việt Nam chốt danh sách dự SEA Games",
      slug: "doi-tuyen-viet-nam-chot-danh-sach-du-sea-games",
      short_description: "Ban huấn luyện chính thức công bố 20 gương mặt xuất sắc nhất sẵn sàng cho mục tiêu huy chương vàng.",
      content: "Sau đợt tập huấn kỹ lưỡng kéo dài 3 tuần tại Trung tâm Huấn luyện thể thao Quốc gia, ban huấn luyện đội tuyển đã chính thức gút danh sách 20 cầu thủ tham dự SEA Games.\n\nĐội hình năm nay là sự kết hợp giữa các trụ cột dày dạn kinh nghiệm và những tài năng trẻ đang có phong độ cao tại giải vô địch quốc gia. Trưởng đoàn khẳng định toàn đội đặt quyết tâm cao nhất để bảo vệ màu cờ sắc áo.",
      cover_image: "/assets/images/bai-3.jpg",
      author_id: 5,
      approved_by: 7,
      category_id: 3,
      topic_id: null,
      is_notable_event: true,
      status: "published",
      rejection_reason: null,
      view_count: 620,
      published_at: "2026-08-13 08:30:00",
      created_at: "2026-08-13 07:30:00",
      updated_at: "2026-08-13 08:30:00"
    },
    {
      id: 3,
      title: "Ứng dụng AI trong giảng đường đại học",
      slug: "ung-dung-ai-trong-giang-duong-dai-hoc",
      short_description: "Nhiều trường đại học bắt đầu đưa AI vào giảng dạy, nghiên cứu và đánh giá năng lực sinh viên.",
      content: "Trí tuệ nhân tạo đang tạo ra bước ngoặt lớn trong giáo dục đại học. Tại nhiều trường đại học hàng đầu, các giảng viên đã tích hợp các mô hình ngôn ngữ lớn để hỗ trợ sinh viên lập trình, dịch thuật và tổng hợp tài liệu học thuật.\n\nTuy nhiên, các chuyên gia giáo dục cũng lưu ý việc xây dựng khung quy tắc liêm chính học thuật nhằm bảo đảm sinh viên sử dụng công nghệ một cách có trách nhiệm.",
      cover_image: "/assets/images/bai-1.jpg",
      author_id: 5,
      approved_by: 7,
      category_id: 2,
      topic_id: 3,
      is_notable_event: true,
      status: "published",
      rejection_reason: null,
      view_count: 430,
      published_at: "2026-08-12 15:00:00",
      created_at: "2026-08-12 14:00:00",
      updated_at: "2026-08-12 15:00:00"
    },
    {
      id: 4,
      title: "Ra mắt tuyến xe buýt điện thông minh tại TP.HCM",
      slug: "ra-mat-tuyen-xe-buyt-dien-thong-minh-tai-tphcm",
      short_description: "Tuyến xe buýt điện không phát thải chính thức vận hành kết nối các khu đô thị trọng điểm.",
      content: "Sáng nay, Sở Giao thông Vận tải TP.HCM đã chính thức cắt băng khánh thành tuyến xe buýt điện mới. Xe được trang bị hệ thống thanh toán vé tự động, wifi tốc độ cao và cổng sạc thông minh cho hành khách.\n\nĐây là bước tiến quan trọng trong đề án chuyển đổi giao thông xanh, giảm ùn tắc và ô nhiễm môi trường.",
      cover_image: "/assets/images/bai-10.jpg",
      author_id: 6,
      approved_by: 7,
      category_id: 1,
      topic_id: null,
      is_notable_event: false,
      status: "published",
      rejection_reason: null,
      view_count: 310,
      published_at: "2026-08-12 09:00:00",
      created_at: "2026-08-12 08:00:00",
      updated_at: "2026-08-12 09:00:00"
    },
    {
      id: 5,
      title: "Phố đi bộ rộn ràng không khí lễ hội cuối tuần",
      slug: "pho-di-bo-ron-rang-cuoi-tuan",
      short_description: "Không khí náo nhiệt của phố đi bộ TP.HCM những ngày giữa tháng 8 thu hút hàng vạn du khách.",
      content: "Vào mỗi dịp cuối tuần, các tuyến phố đi bộ trung tâm lại trở thành điểm hẹn văn hóa sôi động với các hoạt động biểu diễn nghệ thuật đường phố, ẩm thực và triển lãm ảnh ngoài trời.\n\nLực lượng an ninh và trật tự đô thị được tăng cường túc trực đảm bảo không gian vui chơi an toàn, văn minh.",
      cover_image: "/assets/images/bai-4.jpg",
      author_id: 6,
      approved_by: 7,
      category_id: 5,
      topic_id: null,
      is_notable_event: false,
      status: "published",
      rejection_reason: null,
      view_count: 280,
      published_at: "2026-08-11 20:00:00",
      created_at: "2026-08-11 19:00:00",
      updated_at: "2026-08-11 20:00:00"
    },
    {
      id: 6,
      title: "Thị trường bán lẻ chuyển mình đón làn sóng mua sắm mới",
      slug: "thi-truong-ban-le-chuyen-minh-don-lan-song-moi",
      short_description: "Các hệ thống siêu thị và chuỗi bán lẻ đồng loạt áp dụng công nghệ thanh toán không chạm và kích cầu tiêu dùng.",
      content: "Ghi nhận tại các trung tâm thương mại lớn, sức mua đang có dấu hiệu tăng trưởng trở lại nhờ vào các chương trình kích cầu tiêu dùng nội địa và tối ưu trải nghiệm khách hàng.\n\nXu hướng kết hợp giữa mua sắm trực tiếp và đặt hàng qua ứng dụng di động đang trở thành tiêu chuẩn bắt buộc.",
      cover_image: "/assets/images/bai-6.jpg",
      author_id: 6,
      approved_by: 7,
      category_id: 5,
      topic_id: null,
      is_notable_event: false,
      status: "published",
      rejection_reason: null,
      view_count: 195,
      published_at: "2026-08-13 11:15:00",
      created_at: "2026-08-13 10:30:00",
      updated_at: "2026-08-13 11:15:00"
    },
    {
      id: 7,
      title: "Sách điện tử và giáo trình số hóa lên ngôi năm học mới",
      slug: "sach-dien-tu-len-ngoi-trong-nam-hoc-moi",
      short_description: "Học sinh và giáo viên nhiều trường chuyển sang dùng sách điện tử và giáo án tương tác trực quan.",
      content: "Bước vào thềm năm học mới, nhu cầu sử dụng sách giáo khoa điện tử và các nền tảng học liệu mở tăng đột biến. Các bộ sách số hóa không chỉ tích hợp video minh họa mà còn cho phép làm bài tập tương tác ngay trên máy tính bảng.",
      cover_image: "/assets/images/bai-5.jpg",
      author_id: 5,
      approved_by: 7,
      category_id: 6,
      topic_id: null,
      is_notable_event: true,
      status: "published",
      rejection_reason: null,
      view_count: 180,
      published_at: "2026-08-13 07:00:00",
      created_at: "2026-08-13 06:15:00",
      updated_at: "2026-08-13 07:00:00"
    },
    {
      id: 8,
      title: "Phim điện ảnh Việt mùa lễ hội đạt kỷ lục doanh thu vé đặt trước",
      slug: "phim-viet-ra-rap-mua-le-hoi",
      short_description: "Loạt tác phẩm điện ảnh nước nhà thu hút khán giả với kịch bản chất lượng và dàn diễn viên thực lực.",
      content: "Thị trường điện ảnh Việt Nam chuẩn bị đón nhận hàng loạt tác phẩm mới vào dịp lễ lớn. Lượng vé đặt trước tại các cụm rạp trên toàn quốc đã vượt mốc kỷ lục so với cùng kỳ năm ngoái.\n\nCác nhà phê bình đánh giá cao sự tiến bộ về mặt kỹ xảo và chiều sâu cốt truyện.",
      cover_image: "/assets/images/bai-7.jpg",
      author_id: 6,
      approved_by: 7,
      category_id: 4,
      topic_id: 4,
      is_notable_event: false,
      status: "published",
      rejection_reason: null,
      view_count: 150,
      published_at: "2026-08-12 18:00:00",
      created_at: "2026-08-12 17:00:00",
      updated_at: "2026-08-12 18:00:00"
    },
    {
      id: 9,
      title: "Chuyển đổi số ở doanh nghiệp SME: Bài toán tối ưu chi phí",
      slug: "chuyen-doi-so-o-doanh-nghiep-nho",
      short_description: "Bài phân tích sâu về cơ hội và rào cản tài chính của các doanh nghiệp vừa và nhỏ trong quá trình số hóa.",
      content: "Chuyển đổi số không còn là khẩu hiệu mà đã trở thành yêu cầu sống còn đối với các doanh nghiệp vừa và nhỏ. Tuy nhiên, bài toán chi phí đầu tư ban đầu và đào tạo nhân sự vẫn là thách thức không nhỏ.\n\nCác giải pháp công nghệ dạng dịch vụ (SaaS) đang mở ra cơ hội tiếp cận linh hoạt với chi phí tối ưu nhất.",
      cover_image: "/assets/images/bai-11.jpg",
      author_id: 5,
      approved_by: 7,
      category_id: 2,
      topic_id: 2,
      is_notable_event: true,
      status: "published",
      rejection_reason: null,
      view_count: 230,
      published_at: "2026-08-11 14:00:00",
      created_at: "2026-08-11 11:00:00",
      updated_at: "2026-08-11 14:00:00"
    },
    {
      id: 10,
      title: "Nhịp sống đô thị sáng sớm qua ống kính phóng viên",
      slug: "nhip-song-do-thi-sang-som",
      short_description: "Ghi nhận không khí trong lành, bình dị và nhộn nhịp của những gánh hàng rong, buổi tập dưỡng sinh lúc bình minh.",
      content: "Khi thành phố còn chìm trong màn sương mờ ảo, những thanh âm đầu tiên của ngày mới đã bắt đầu vang lên từ các khu chợ đầu mối, những cung đường chạy bộ ven sông và những quán cà phê cóc đầu ngõ.\n\nMột lát cắt bình dị nhưng tràn đầy năng lượng tích cực của nhịp sống đô thị.",
      cover_image: "/assets/images/bai-8.jpg",
      author_id: 6,
      approved_by: 7,
      category_id: 1,
      topic_id: 1,
      is_notable_event: false,
      status: "published",
      rejection_reason: null,
      view_count: 140,
      published_at: "2026-08-10 07:30:00",
      created_at: "2026-08-10 06:00:00",
      updated_at: "2026-08-10 07:30:00"
    },
    {
      id: 11,
      title: "Góc cà phê yên tĩnh hoài niệm giữa Sài Gòn",
      slug: "goc-ca-phe-yen-tinh-giua-sai-gon",
      short_description: "Những quán cà phê mang phong cách cổ điển là nơi người trẻ tìm lại sự thư thái giữa nhịp sống hối hả.",
      content: "Nép mình trong những con hẻm rợp bóng cây xanh, các quán cà phê mang phong cách retro với tiếng nhạc êm dịu đang là điểm dừng chân yêu thích của những ai muốn tìm một khoảng lặng sau tuần làm việc căng thẳng.",
      cover_image: "/assets/images/bai-9.jpg",
      author_id: 5,
      approved_by: 7,
      category_id: 5,
      topic_id: null,
      is_notable_event: false,
      status: "published",
      rejection_reason: null,
      view_count: 110,
      published_at: "2026-08-09 15:00:00",
      created_at: "2026-08-09 14:00:00",
      updated_at: "2026-08-09 15:00:00"
    },
    {
      id: 12,
      title: "Cảnh báo thủ đoạn mạo danh ngân hàng lừa đảo qua tin nhắn",
      slug: "canh-bao-mao-danh-ngan-hang-lua-dao",
      short_description: "Chuyên gia an ninh mạng khuyến cáo người dân tuyệt đối không bấm vào các đường link lạ mạo danh hệ thống ngân hàng.",
      content: "Thời gian gần đây, xuất hiện nhiều hình thức lừa đảo qua tin nhắn SMS mạo danh thương hiệu ngân hàng với nội dung thông báo tài khoản bị khóa hoặc có giao dịch bất thường.\n\nCơ quan chức năng khuyến cáo người dân cần bình tĩnh, tuyệt đối không cung cấp mã OTP hay thông tin bảo mật cho bất kỳ ai.",
      cover_image: "/assets/images/bai-12.jpg",
      author_id: 5,
      approved_by: 7,
      category_id: 2,
      topic_id: null,
      is_notable_event: true,
      status: "published",
      rejection_reason: null,
      view_count: 380,
      published_at: "2026-08-08 10:00:00",
      created_at: "2026-08-08 09:00:00",
      updated_at: "2026-08-08 10:00:00"
    },
    // Bài viết có lượt xem cao nhất (Top 1):
    {
      id: 16,
      title: "Tổng kết kỳ thi tốt nghiệp THPT Quốc gia 2026",
      slug: "tong-ket-ky-thi-tot-nghiep-thpt-2026",
      short_description: "Bộ Giáo dục và Đào tạo công bố phổ điểm và tỷ lệ tốt nghiệp trên toàn quốc.",
      content: "Kỳ thi tốt nghiệp THPT năm nay diễn ra an toàn, nghiêm túc với tỷ lệ tốt nghiệp đạt trên 98%...",
      cover_image: "/assets/images/bai-5.jpg",
      author_id: 5,
      approved_by: 7,
      category_id: 6,
      topic_id: null,
      is_notable_event: true,
      status: "published",
      rejection_reason: null,
      view_count: 920,
      published_at: "2026-08-13 16:30:00",
      created_at: "2026-08-13 14:00:00",
      updated_at: "2026-08-13 16:30:00"
    },

    // Bài test các trạng thái cho Workflow Phóng viên / Biên tập viên:
    {
      id: 13,
      title: "Giải pháp nâng cao năng lực cạnh tranh cho nông sản Việt",
      slug: "giai-phap-nang-cao-nang-luc-nong-san",
      short_description: "Bài viết gửi duyệt đề xuất xây dựng chuỗi cung ứng lạnh và tiêu chuẩn xuất khẩu.",
      content: "Nội dung bài viết chờ duyệt...",
      cover_image: "/assets/images/bai-13.jpg",
      author_id: 5,
      category_id: 1,
      topic_id: null,
      is_notable_event: false,
      status: "pending",
      rejection_reason: null,
      view_count: 0,
      published_at: null,
      created_at: "2026-08-13 11:00:00",
      updated_at: "2026-08-13 11:00:00"
    },
    {
      id: 14,
      title: "Xu hướng âm nhạc indie của giới trẻ năm 2026",
      slug: "xu-huong-am-nhac-indie-2026",
      short_description: "Bản nháp ghi chép về các ban nhạc trẻ độc lập.",
      content: "Nội dung bản nháp...",
      cover_image: "/assets/images/bai-14.jpg",
      author_id: 6,
      category_id: 4,
      topic_id: null,
      is_notable_event: false,
      status: "draft",
      rejection_reason: null,
      view_count: 0,
      published_at: null,
      created_at: "2026-08-13 11:30:00",
      updated_at: "2026-08-13 11:30:00"
    },
    {
      id: 15,
      title: "Phóng sự: Thực trạng rác thải nhựa tại các điểm du lịch",
      slug: "thuc-trang-rac-thai-nhua-du-lich",
      short_description: "Bài viết bị từ chối do thiếu hình ảnh minh chứng thực tế.",
      content: "Nội dung bài viết...",
      cover_image: "/assets/images/bai-15.jpg",
      author_id: 6,
      category_id: 5,
      topic_id: null,
      is_notable_event: false,
      status: "rejected",
      rejection_reason: "Thiếu số liệu khảo sát và hình ảnh thực địa. Vui lòng bổ sung trước khi gửi lại.",
      view_count: 0,
      published_at: null,
      created_at: "2026-08-12 10:00:00",
      updated_at: "2026-08-12 16:00:00"
    }
  ],

  // ============================================================================
  // 6. BẢNG LIÊN KẾT BÀI VIẾT - THẺ (article_tags - N:N)
  // ============================================================================
  article_tags: [
    { article_id: 1, tag_id: 2 }, // Giá vàng
    { article_id: 1, tag_id: 6 }, // Thị trường
    { article_id: 2, tag_id: 3 }, // SEA Games
    { article_id: 2, tag_id: 11 }, // Sức khỏe
    { article_id: 3, tag_id: 1 }, // AI
    { article_id: 3, tag_id: 4 }, // Chuyển đổi số
    { article_id: 3, tag_id: 5 }, // Giáo dục
    { article_id: 4, tag_id: 8 }, // Đô thị
    { article_id: 4, tag_id: 9 }, // Giao thông xanh
    { article_id: 5, tag_id: 5 }, // Giáo dục
    { article_id: 5, tag_id: 8 }, // Đô thị
    { article_id: 5, tag_id: 12 }, // Du lịch
    { article_id: 6, tag_id: 4 }, // Chuyển đổi số
    { article_id: 6, tag_id: 6 }, // Thị trường
    { article_id: 6, tag_id: 10 }, // Khởi nghiệp
    { article_id: 7, tag_id: 5 }, // Giáo dục
    { article_id: 7, tag_id: 7 }, // Phim Việt
    { article_id: 8, tag_id: 7 }, // Phim Việt
    { article_id: 8, tag_id: 8 }, // Đô thị
    { article_id: 8, tag_id: 12 }, // Du lịch
    { article_id: 9, tag_id: 4 }, // Chuyển đổi số
    { article_id: 9, tag_id: 6 }, // Thị trường
    { article_id: 9, tag_id: 10 }, // Khởi nghiệp
    { article_id: 10, tag_id: 8 }, // Đô thị
    { article_id: 10, tag_id: 12 }, // Du lịch
    { article_id: 11, tag_id: 8 }, // Đô thị
    { article_id: 11, tag_id: 11 }, // Sức khỏe
    { article_id: 11, tag_id: 12 }, // Du lịch
    { article_id: 12, tag_id: 1 }, // AI
    { article_id: 12, tag_id: 4 }, // Chuyển đổi số
    { article_id: 16, tag_id: 5 }  // Giáo dục (bài cũ 25/07)
  ],

  // ============================================================================
  // 7. BẢNG BÌNH LUẬN (comments)
  // ============================================================================
  comments: [
    {
      id: 1,
      article_id: 1,
      user_id: 1,
      content: "Bài phân tích về giá vàng rất kịp thời và sát thực tế thị trường.",
      is_deleted: false,
      created_at: "2026-08-13 10:30:00",
      updated_at: "2026-08-13 10:30:00"
    },
    {
      id: 2,
      article_id: 1,
      user_id: 3,
      content: "Biến động mạnh thế này người mua cần hết sức cẩn trọng.",
      is_deleted: false,
      created_at: "2026-08-13 10:45:00",
      updated_at: "2026-08-13 10:45:00"
    },
    {
      id: 3,
      article_id: 2,
      user_id: 3,
      content: "Danh sách triệu tập rất hợp lý, chúc đội tuyển thi đấu thăng hoa!",
      is_deleted: false,
      created_at: "2026-08-13 09:15:00",
      updated_at: "2026-08-13 09:15:00"
    },
    {
      id: 4,
      article_id: 3,
      user_id: 1,
      content: "AI là công cụ hỗ trợ tuyệt vời nếu biết tận dụng đúng cách.",
      is_deleted: false,
      created_at: "2026-08-12 16:20:00",
      updated_at: "2026-08-12 16:20:00"
    },
    {
      id: 5,
      article_id: 3,
      user_id: 2,
      content: "Vào nhóm kín nhận tài liệu miễn phí tại link...",
      is_deleted: false,
      created_at: "2026-08-12 16:45:00",
      updated_at: "2026-08-12 16:45:00"
    },
    {
      id: 6,
      article_id: 5,
      user_id: 1,
      content: "Phố đi bộ tuần này có nhiều tiết mục biểu diễn rất ấn tượng.",
      is_deleted: false,
      created_at: "2026-08-11 21:30:00",
      updated_at: "2026-08-11 21:30:00"
    },
    {
      id: 7,
      article_id: 12,
      user_id: 3,
      content: "Nhiều người lớn tuổi rất dễ bị dính bẫy tin nhắn này, cần chia sẻ rộng rãi.",
      is_deleted: false,
      created_at: "2026-08-08 11:00:00",
      updated_at: "2026-08-08 11:00:00"
    }
  ],

  // ============================================================================
  // 8. BẢNG YÊU THÍCH (favorites)
  // ============================================================================
  favorites: [
    { user_id: 1, article_id: 1, created_at: "2026-08-13 10:15:00" },
    { user_id: 1, article_id: 3, created_at: "2026-08-12 15:30:00" },
    { user_id: 1, article_id: 9, created_at: "2026-08-11 15:00:00" },
    { user_id: 3, article_id: 2, created_at: "2026-08-13 09:00:00" },
    { user_id: 3, article_id: 12, created_at: "2026-08-08 10:30:00" }
  ],

  // ============================================================================
  // 9. BẢNG PHÂN CÔNG ĐỀ TÀI (topics)
  // Status: 'assigned' (đã giao), 'submitted' (đã nộp), 'overdue' (quá hạn)
  // ============================================================================
  topics: [
    {
      id: 1,
      title: "Nhịp sống đô thị sáng sớm",
      description: "Ghi nhận không khí, nhịp sinh hoạt và mưu sinh của người dân lúc sáng sớm.",
      category_id: 1,
      reporter_id: 6,
      editor_id: 7,
      deadline: "2026-08-20 23:59:00",
      status: "assigned",
      submitted_at: null,
      created_at: "2026-08-10 08:00:00",
      updated_at: "2026-08-10 08:00:00"
    },
    {
      id: 2,
      title: "Chuyển đổi số ở doanh nghiệp vừa và nhỏ (SME)",
      description: "Bài phân tích sâu về cơ hội, giải pháp và thách thức chuyển đổi số trong khối SME.",
      category_id: 2,
      reporter_id: 5,
      editor_id: 7,
      deadline: "2026-08-15 23:59:00",
      status: "submitted",
      submitted_at: "2026-08-11 11:00:00",
      created_at: "2026-08-08 08:00:00",
      updated_at: "2026-08-11 11:00:00"
    },
    {
      id: 3,
      title: "Ứng dụng AI và Công nghệ trong Giáo dục đại học",
      description: "Khảo sát thực tế các mô hình AI đang hỗ trợ sinh viên và giảng viên tại các trường đại học.",
      category_id: 2,
      reporter_id: 5,
      editor_id: 7,
      deadline: "2026-08-14 23:59:00",
      status: "submitted",
      submitted_at: "2026-08-12 14:00:00",
      created_at: "2026-08-01 08:00:00",
      updated_at: "2026-08-12 14:00:00"
    },
    {
      id: 4,
      title: "Điện ảnh Việt mùa lễ hội 2/9",
      description: "Tổng hợp danh sách các phim Việt ra rạp và nhận định từ các chuyên gia phê bình điện ảnh.",
      category_id: 4,
      reporter_id: 6,
      editor_id: 7,
      deadline: "2026-08-10 23:59:00",
      status: "overdue",
      submitted_at: null,
      created_at: "2026-08-01 08:00:00",
      updated_at: "2026-08-11 00:00:00"
    }
  ],

  // ============================================================================
  // 10. BẢNG LIÊN KẾT ĐỀ TÀI - THẺ (topic_tags - N:N)
  // ============================================================================
  topic_tags: [
    { topic_id: 1, tag_id: 8 }, // Đề tài 1: Đô thị
    { topic_id: 2, tag_id: 4 }, // Đề tài 2: Chuyển đổi số
    { topic_id: 3, tag_id: 1 }, // Đề tài 3: AI
    { topic_id: 3, tag_id: 5 }, // Đề tài 3: Giáo dục
    { topic_id: 4, tag_id: 7 }  // Đề tài 4: Phim Việt
  ]
};

// =====================================================
// MOCK_DATA - DỮ LIỆU MẪU CHUNG CỦA WEBSITE MẠCH TIN
// Cấu trúc file này tương tự database thật sau này:
// mỗi mảng = 1 bảng, mỗi trường = 1 cột.
// Khi lên PHP: tạo bảng theo đúng tên này, chỉ thay nguồn dữ liệu.
// "Hôm nay" của dữ liệu: 13/08/2026.
// =====================================================

const MOCK_DATA = {

  // ---------- bảng site_settings ----------
  site: {
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

  // ---------- bảng users ----------
  // Mật khẩu demo chung: 12345678
  users: [
    { id: 1, username: "user01", email: "user01@gmail.com", password: "12345678",
      full_name: "Nguyễn Văn User", date_of_birth: "2004-01-01", phone: "0901000111",
      avatar: "/assets/images/avatar-1.png", bio: "Độc giả trung thành của Mạch Tin.",
      role: "user", status: "active", comment_locked: false },
    { id: 2, username: "user02", email: "user02@gmail.com", password: "12345678",
      full_name: "Trần Thị Bình Luận", date_of_birth: "2003-02-02", phone: "0901000222",
      avatar: "/assets/images/avatar-2.png", bio: "",
      role: "user", status: "active", comment_locked: true },
    { id: 3, username: "user03", email: "user03@gmail.com", password: "12345678",
      full_name: "Lê Văn Đọc", date_of_birth: "2002-03-03", phone: "0901000333",
      avatar: "/assets/images/avatar-3.png", bio: "",
      role: "user", status: "active", comment_locked: false },
    { id: 4, username: "user04", email: "user04@gmail.com", password: "12345678",
      full_name: "Phạm Bị Khóa", date_of_birth: "2001-04-04", phone: "0901000444",
      avatar: "/assets/images/avatar-4.png", bio: "",
      role: "user", status: "locked", comment_locked: false },
    { id: 5, username: "reporter01", email: "reporter01@gmail.com", password: "12345678",
      full_name: "Thanh Ngân", date_of_birth: "2000-05-10", phone: "0901000555",
      avatar: "/assets/images/avatar-5.png", bio: "Phóng viên mảng công nghệ, giáo dục và thể thao.",
      role: "reporter", status: "active", comment_locked: false },
    { id: 6, username: "reporter02", email: "reporter02@gmail.com", password: "12345678",
      full_name: "Minh Phương", date_of_birth: "1999-06-20", phone: "0901000666",
      avatar: "/assets/images/avatar-6.png", bio: "Phóng viên mảng thời sự và đời sống.",
      role: "reporter", status: "active", comment_locked: false },
    { id: 7, username: "editor01", email: "editor01@gmail.com", password: "12345678",
      full_name: "Lê Biên Tập", date_of_birth: "1997-07-15", phone: "0901000777",
      avatar: "/assets/images/avatar-7.png", bio: "Biên tập viên nội dung của Mạch Tin.",
      role: "editor", status: "active", comment_locked: false },
    { id: 8, username: "admin01", email: "admin01@gmail.com", password: "12345678",
      full_name: "Nguyễn Quản Trị", date_of_birth: "1995-08-25", phone: "0901000888",
      avatar: "/assets/images/avatar-8.png", bio: "Quản trị viên hệ thống.",
      role: "admin", status: "active", comment_locked: false }
  ],

  // ---------- bảng categories ----------
  categories: [
    { id: 1, name: "Thời sự", slug: "thoi-su", description: "Tin tức thời sự trong nước." },
    { id: 2, name: "Công nghệ", slug: "cong-nghe", description: "Công nghệ, AI, chuyển đổi số." },
    { id: 3, name: "Thể thao", slug: "the-thao", description: "Tin thể thao trong nước và quốc tế." },
    { id: 4, name: "Giải trí", slug: "giai-tri", description: "Phim ảnh, âm nhạc, nghệ thuật." },
    { id: 5, name: "Đời sống", slug: "doi-song", description: "Câu chuyện đời sống, xã hội." },
    { id: 6, name: "Giáo dục", slug: "giao-duc", description: "Tin giáo dục, đào tạo." }
  ],

  // ---------- bảng tags ----------
  tags: [
    { id: 1, name: "AI", slug: "ai" },
    { id: 2, name: "Giá vàng", slug: "gia-vang" },
    { id: 3, name: "SEA Games", slug: "sea-games" },
    { id: 4, name: "Chuyển đổi số", slug: "chuyen-doi-so" },
    { id: 5, name: "Giáo dục", slug: "giao-duc" },
    { id: 6, name: "Thị trường", slug: "thi-truong" },
    { id: 7, name: "Phim Việt", slug: "phim-viet" },
    { id: 8, name: "Đô thị", slug: "do-thi" }
  ],

  // ---------- bảng articles ----------
  articles: [
    { id: 1, title: "Ứng dụng AI trong giảng đường đại học",
      slug: "ung-dung-ai-trong-giang-duong-dai-hoc",
      short_description: "Nhiều trường đại học bắt đầu đưa AI vào giảng dạy và đánh giá.",
      content: "Nội dung đầy đủ bài AI trong giảng đường... (đoạn 1)\n\nNội dung đầy đủ bài AI trong giảng đường... (đoạn 2)",
      cover_image: "/assets/images/bai-1.jpg", status: "published",
      author_id: 5, category_id: 2, topic_id: 3, rejection_reason: null,
      view_count: 320, published_at: "2026-08-09 08:00:00",
      created_at: "2026-08-08 09:00:00", updated_at: "2026-08-09 08:00:00" },
    { id: 2, title: "Giá vàng trong nước lập đỉnh mới",
      slug: "gia-vang-trong-nuoc-lap-dinh-moi",
      short_description: "Giá vàng miếng sáng 12/8 vượt mọi dự báo của chuyên gia.",
      content: "Nội dung đầy đủ bài giá vàng... (đoạn 1)\n\nNội dung đầy đủ bài giá vàng... (đoạn 2)",
      cover_image: "/assets/images/bai-2.jpg", status: "published",
      author_id: 6, category_id: 1, topic_id: null, rejection_reason: null,
      view_count: 450, published_at: "2026-08-12 07:30:00",
      created_at: "2026-08-12 06:00:00", updated_at: "2026-08-12 07:30:00" },
    { id: 3, title: "Đội tuyển Việt Nam chốt danh sách dự SEA Games",
      slug: "doi-tuyen-viet-nam-chot-danh-sach-du-sea-games",
      short_description: "Ban huấn luyện công bố 20 gương mặt cuối cùng.",
      content: "Nội dung đầy đủ bài SEA Games... (đoạn 1)\n\nNội dung đầy đủ bài SEA Games... (đoạn 2)",
      cover_image: "/assets/images/bai-3.jpg", status: "published",
      author_id: 5, category_id: 3, topic_id: null, rejection_reason: null,
      view_count: 210, published_at: "2026-08-11 09:00:00",
      created_at: "2026-08-11 08:00:00", updated_at: "2026-08-11 09:00:00" },
    { id: 4, title: "Phố đi bộ rộn ràng cuối tuần",
      slug: "pho-di-bo-ron-rang-cuoi-tuan",
      short_description: "Không khí phố đi bộ TP.HCM những ngày giữa tháng 8.",
      content: "Nội dung đầy đủ bài phố đi bộ... (đoạn 1)\n\nNội dung đầy đủ bài phố đi bộ... (đoạn 2)",
      cover_image: "/assets/images/bai-4.jpg", status: "published",
      author_id: 6, category_id: 5, topic_id: null, rejection_reason: null,
      view_count: 150, published_at: "2026-08-10 10:00:00",
      created_at: "2026-08-10 09:00:00", updated_at: "2026-08-10 10:00:00" },
    { id: 5, title: "Sách điện tử lên ngôi trong năm học mới",
      slug: "sach-dien-tu-len-ngoi-trong-nam-hoc-moi",
      short_description: "Học sinh nhiều trường chuyển sang dùng sách điện tử.",
      content: "Nội dung đầy đủ bài sách điện tử... (đoạn 1)\n\nNội dung đầy đủ bài sách điện tử... (đoạn 2)",
      cover_image: "/assets/images/bai-5.jpg", status: "published",
      author_id: 5, category_id: 6, topic_id: null, rejection_reason: null,
      view_count: 90, published_at: "2026-08-08 07:00:00",
      created_at: "2026-08-07 15:00:00", updated_at: "2026-08-08 07:00:00" },
    { id: 6, title: "Chuyển đổi số ở doanh nghiệp nhỏ: cơ hội và thách thức",
      slug: "chuyen-doi-so-o-doanh-nghiep-nho",
      short_description: "Bài viết thực hiện theo đề tài Editor giao.",
      content: "Nội dung đầy đủ bài chuyển đổi số... (đoạn 1)\n\nNội dung đầy đủ bài chuyển đổi số... (đoạn 2)",
      cover_image: "/assets/images/bai-6.jpg", status: "pending",
      author_id: 5, category_id: 2, topic_id: 2, rejection_reason: null,
      view_count: 0, published_at: null,
      created_at: "2026-08-12 09:00:00", updated_at: "2026-08-12 09:00:00" },
    { id: 7, title: "Phim Việt ra rạp mùa lễ hội",
      slug: "phim-viet-ra-rap-mua-le-hoi",
      short_description: "Loạt phim Việt chuẩn bị ra rạp dịp lễ 2/9.",
      content: "Nội dung đầy đủ bài phim Việt... (đoạn 1)\n\nNội dung đầy đủ bài phim Việt... (đoạn 2)",
      cover_image: "/assets/images/bai-7.jpg", status: "rejected",
      author_id: 6, category_id: 4, topic_id: null,
      rejection_reason: "Thiếu nguồn trích dẫn và ảnh bản quyền. Bổ sung rồi gửi duyệt lại.",
      view_count: 0, published_at: null,
      created_at: "2026-08-10 10:00:00", updated_at: "2026-08-11 10:00:00" },
    { id: 8, title: "Nhịp sống đô thị sáng sớm",
      slug: "nhip-song-do-thi-sang-som",
      short_description: "Bài đang viết theo đề tài được giao.",
      content: "Nội dung đầy đủ bài nhịp sống đô thị... (đoạn 1)",
      cover_image: "/assets/images/bai-8.jpg", status: "draft",
      author_id: 6, category_id: 1, topic_id: 1, rejection_reason: null,
      view_count: 0, published_at: null,
      created_at: "2026-08-12 07:00:00", updated_at: "2026-08-12 07:30:00" },
    { id: 9, title: "Góc cà phê yên tĩnh giữa Sài Gòn",
      slug: "goc-ca-phe-yen-tinh-giua-sai-gon",
      short_description: "Bài nháp tự viết của Thanh Ngân.",
      content: "Nội dung đầy đủ bài góc cà phê... (đoạn 1)",
      cover_image: "/assets/images/bai-9.jpg", status: "draft",
      author_id: 5, category_id: 5, topic_id: null, rejection_reason: null,
      view_count: 0, published_at: null,
      created_at: "2026-08-09 14:00:00", updated_at: "2026-08-09 15:00:00" }
  ],

  // ---------- bảng article_tags ----------
  article_tags: [
    { article_id: 1, tag_id: 1 }, { article_id: 1, tag_id: 5 },
    { article_id: 2, tag_id: 2 }, { article_id: 2, tag_id: 6 },
    { article_id: 3, tag_id: 3 },
    { article_id: 5, tag_id: 5 }, { article_id: 5, tag_id: 4 },
    { article_id: 6, tag_id: 4 },
    { article_id: 7, tag_id: 7 },
    { article_id: 8, tag_id: 8 }
  ],

  // ---------- bảng comments ----------
  comments: [
    { id: 1, article_id: 2, user_id: 1, content: "Tin hữu ích, cảm ơn tòa soạn.",
      is_deleted: false, created_at: "2026-08-12 08:00:00", updated_at: "2026-08-12 08:00:00" },
    { id: 2, article_id: 2, user_id: 3, content: "Giá vàng tăng nhanh quá.",
      is_deleted: false, created_at: "2026-08-12 09:00:00", updated_at: "2026-08-12 09:00:00" },
    { id: 3, article_id: 1, user_id: 2, content: "Vào link nhận thưởng... (bình luận spam)",
      is_deleted: false, created_at: "2026-08-11 09:00:00", updated_at: "2026-08-11 09:00:00" },
    { id: 4, article_id: 1, user_id: 1, content: "Nội dung dễ hiểu, mong có thêm bài về AI.",
      is_deleted: false, created_at: "2026-08-11 10:00:00", updated_at: "2026-08-11 10:00:00" },
    { id: 5, article_id: 3, user_id: 3, content: "Chúc đội tuyển thi đấu tốt!",
      is_deleted: false, created_at: "2026-08-11 11:00:00", updated_at: "2026-08-11 11:00:00" },
    { id: 6, article_id: 4, user_id: 1, content: "Cuối tuần nhất định phải đi.",
      is_deleted: false, created_at: "2026-08-10 12:00:00", updated_at: "2026-08-10 12:00:00" },
    { id: 7, article_id: 1, user_id: 3, content: "Bài viết rất cập nhật.",
      is_deleted: false, created_at: "2026-08-11 12:00:00", updated_at: "2026-08-11 12:00:00" }
  ],

  // ---------- bảng comment_reports ----------
  comment_reports: [
    { id: 1, comment_id: 3, reporter_id: 1, reason_type: "spam",
      reason_detail: "Bình luận kèm link quảng cáo cá độ.",
      status: "pending", resolved_by: null, resolved_at: null,
      created_at: "2026-08-11 10:00:00" }
  ],

  // ---------- bảng favorites ----------
  favorites: [
    { user_id: 1, article_id: 1, created_at: "2026-08-11 11:00:00" },
    { user_id: 1, article_id: 2, created_at: "2026-08-12 09:00:00" },
    { user_id: 3, article_id: 2, created_at: "2026-08-12 10:00:00" }
  ],

  // ---------- bảng reading_history ----------
  reading_history: [
    { id: 1, user_id: 1, article_id: 2, viewed_at: "2026-08-12 20:00:00" },
    { id: 2, user_id: 1, article_id: 1, viewed_at: "2026-08-12 21:30:00" },
    { id: 3, user_id: 1, article_id: 4, viewed_at: "2026-08-13 07:00:00" }
  ],

  // ---------- bảng notifications ----------
  notifications: [
    { id: 1, user_id: 6, type: "topic_assigned",
      title: "Bạn được phân công đề tài mới",
      content: "Editor giao đề tài \"Nhịp sống đô thị sáng sớm\" cho bạn.",
      link: "/reporter/my-topics.html", is_read: false, created_at: "2026-08-10 08:00:00" },
    { id: 2, user_id: 6, type: "article_rejected",
      title: "Bài viết bị từ chối",
      content: "Bài \"Phim Việt ra rạp mùa lễ hội\" bị từ chối: Thiếu nguồn trích dẫn và ảnh bản quyền.",
      link: "/reporter/my-articles.html", is_read: false, created_at: "2026-08-11 10:00:00" },
    { id: 3, user_id: 5, type: "article_approved",
      title: "Bài viết đã được duyệt",
      content: "Bài \"Đội tuyển Việt Nam chốt danh sách dự SEA Games\" đã được đăng.",
      link: "/reporter/my-articles.html", is_read: false, created_at: "2026-08-11 09:00:00" },
    { id: 4, user_id: 5, type: "topic_assigned",
      title: "Bạn được phân công đề tài mới",
      content: "Editor giao đề tài \"Chuyển đổi số ở doanh nghiệp nhỏ\" cho bạn.",
      link: "/reporter/my-topics.html", is_read: true, created_at: "2026-08-08 08:00:00" },
    { id: 5, user_id: 2, type: "comment_locked",
      title: "Bình luận bị hạn chế",
      content: "Tài khoản của bạn đang bị khóa quyền bình luận do vi phạm.",
      link: "/user/notifications.html", is_read: false, created_at: "2026-08-11 11:00:00" }
  ],

  // ---------- bảng topics ----------
  topics: [
    { id: 1, title: "Nhịp sống đô thị sáng sớm",
      description: "Ghi nhận không khí đô thị lúc sáng sớm.",
      editor_id: 7, reporter_id: 6, category_id: 1,
      deadline: "2026-08-20 23:59:00", status: "assigned",
      submitted_at: null, created_at: "2026-08-10 08:00:00", updated_at: "2026-08-10 08:00:00" },
    { id: 2, title: "Chuyển đổi số ở doanh nghiệp nhỏ",
      description: "Bài phân tích cơ hội và thách thức chuyển đổi số.",
      editor_id: 7, reporter_id: 5, category_id: 2,
      deadline: "2026-08-15 23:59:00", status: "submitted",
      submitted_at: "2026-08-12 09:00:00", created_at: "2026-08-08 08:00:00", updated_at: "2026-08-12 09:00:00" },
    { id: 3, title: "AI trong giảng đường đại học",
      description: "Bài viết về ứng dụng AI trong giáo dục đại học.",
      editor_id: 7, reporter_id: 5, category_id: 2,
      deadline: "2026-08-05 23:59:00", status: "submitted",
      submitted_at: "2026-08-08 09:00:00", created_at: "2026-08-01 08:00:00", updated_at: "2026-08-08 09:00:00" },
    { id: 4, title: "Phim Việt mùa lễ hội",
      description: "Bài tổng hợp phim Việt ra rạp dịp lễ.",
      editor_id: 7, reporter_id: 6, category_id: 4,
      deadline: "2026-08-10 23:59:00", status: "overdue",
      submitted_at: null, created_at: "2026-08-01 08:00:00", updated_at: "2026-08-11 00:00:00" }
  ],

  // ---------- bảng topic_tags ----------
  topic_tags: [
    { topic_id: 1, tag_id: 8 },
    { topic_id: 2, tag_id: 4 },
    { topic_id: 3, tag_id: 1 }, { topic_id: 3, tag_id: 5 },
    { topic_id: 4, tag_id: 7 }
  ]
};
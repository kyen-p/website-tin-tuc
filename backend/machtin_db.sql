-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th9 17, 2026 lúc 05:58 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `machtin_db`
--
CREATE DATABASE IF NOT EXISTS `machtin_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `machtin_db`;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `articles`
--

CREATE TABLE `articles` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `short_description` text DEFAULT NULL,
  `content` longtext DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `author_id` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `is_notable_event` tinyint(1) DEFAULT 0,
  `status` enum('draft','pending','published','rejected','hidden') DEFAULT 'draft',
  `rejection_reason` text DEFAULT NULL,
  `view_count` int(11) DEFAULT 0,
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `articles`
--

INSERT INTO `articles` (`id`, `title`, `slug`, `short_description`, `content`, `cover_image`, `author_id`, `approved_by`, `category_id`, `is_notable_event`, `status`, `rejection_reason`, `view_count`, `published_at`, `created_at`, `updated_at`) VALUES
(1, 'Việt Nam công bố GDP quý 2/2026 tăng 7.2%, cao nhất 5 năm', 'viet-nam-cong-bo-gdp-quy-2-2026-tang-7-2-cao-nhat-5-nam', 'Tổng cục Thống kê vừa công bố mức tăng trưởng GDP quý 2/2026 đạt 7.2%, vượt kỳ vọng của nhiều tổ chức quốc tế.', '<p style=\"text-align:justify;\">Theo báo cáo vừa được Tổng cục Thống kê công bố sáng nay, tăng trưởng GDP quý 2/2026 của Việt Nam đạt<strong> 7.2%</strong>, mức cao nhất trong vòng 5 năm trở lại đây và vượt xa dự báo 6.5% mà nhiều tổ chức quốc tế đưa ra hồi đầu năm.</p><h3 style=\"text-align:justify;\">Bức tranh tăng trưởng toàn cảnh</h3><p style=\"text-align:justify;\">Kết quả này đưa Việt Nam vào nhóm các nền kinh tế có tốc độ tăng trưởng cao nhất khu vực Đông Nam Á, chỉ xếp sau Indonesia và Philippines. Động lực chính đến từ <strong>khu vực công nghiệp chế biến chế tạo</strong> và<strong> dòng vốn FDI</strong> tiếp tục đổ mạnh vào các khu công nghiệp phía Nam.</p><p style=\"text-align:justify;\"><br>Đáng chú ý, mức tăng trưởng này đạt được trong bối cảnh kinh tế toàn cầu vẫn đang phục hồi chậm sau đại dịch, cho thấy <i>sức chống chịu và nội lực của nền kinh tế Việt Nam</i> đã được cải thiện đáng kể. Đây là tín hiệu lạc quan cho giai đoạn còn lại của năm 2026.</p><h4 style=\"text-align:justify;\">Động lực từ khu vực công nghiệp</h4><ul><li style=\"text-align:justify;\">Công nghiệp chế biến chế tạo tăng 9.8% so với cùng kỳ năm trước</li><li style=\"text-align:justify;\">Xây dựng tăng 7.5%, nhờ đẩy mạnh đầu tư công các dự án hạ tầng trọng điểm</li><li style=\"text-align:justify;\">Dịch vụ tăng 6.9%, phục hồi mạnh ở nhóm du lịch - lưu trú và vận tải</li></ul><h3 style=\"text-align:justify;\">Số liệu chi tiết theo ngành</h3><figure class=\"table\"><table><tbody><tr><td>Ngành</td><td>Tăng trưởng</td><td>Đóng góp vào GDP</td></tr><tr><td>Nông - Lâm - Thủy sản</td><td>3.2%</td><td>11.8%</td></tr><tr><td>Công nghiệp - Xây dựng</td><td>8.9%</td><td>38.2%</td></tr><tr><td>Dịch vụ</td><td>6.9%</td><td>42.5%</td></tr><tr><td>Thuế sản phẩm</td><td>5.4%</td><td>7.5%</td></tr></tbody></table></figure><h3 style=\"text-align:justify;\">Phản ứng của chuyên gia</h3><blockquote><p style=\"text-align:justify;\">\"Đây là tín hiệu rất tích cực cho thấy nền kinh tế đã bước vào chu kỳ phục hồi bền vững. Tuy nhiên, chúng ta không nên chủ quan vì lạm phát vẫn đang tiềm ẩn nhiều rủi ro từ bên ngoài.\"<br>- TS. Nguyễn Văn A, chuyên gia kinh tế Đại học Kinh tế Quốc dân</p></blockquote><hr><h3 style=\"text-align:justify;\">Triển vọng quý 3</h3><ol><li style=\"text-align:justify;\">Dự báo tăng trưởng tiếp tục duy trì ở mức 6.8-7.5%</li><li style=\"text-align:justify;\">Xuất khẩu được kỳ vọng phục hồi nhờ nhu cầu từ thị trường Mỹ và EU</li><li style=\"text-align:justify;\">Áp lực lạm phát cần theo dõi sát, đặc biệt ở nhóm lương thực - thực phẩm</li></ol><p style=\"text-align:justify;\">Với đà tăng trưởng hiện tại, nhiều chuyên gia nhận định mục tiêu tăng trưởng cả năm 2026 ở mức 6.5-7% là hoàn toàn khả thi.&nbsp;</p><p style=\"text-align:justify;\">Để tra cứu số liệu gốc, độc giả có thể truy cập trực tiếp <a href=\"https://www.nso.gov.vn/\"><i><u>website Tổng cục Thống kê</u></i></a>.</p>', 'backend/api/upload/articles/article_6aabfc4180e79_1789656129.jpg', 4, 2, 2, 1, 'published', NULL, 5300, '2026-09-12 08:30:00', '2026-09-08 07:15:00', '2026-09-12 08:30:00'),
(2, 'Việt Nam giành HCV SEA Games 33 môn bóng đá nam', 'viet-nam-gianh-hcv-sea-games-33-mon-bong-da-nam', 'Đội tuyển U23 Việt Nam đánh bại Thái Lan 2-1 trong trận chung kết nghẹt thở, mang về tấm HCV lịch sử.', '<p>Đội tuyển U23 Việt Nam đã làm nên lịch sử khi đánh bại Thái Lan với tỷ số <strong>2-1</strong> trong trận chung kết môn bóng đá nam SEA Games 33, mang về tấm HCV danh giá. Chiến thắng này cũng đánh dấu lần thứ ba trong lịch sử bóng đá Việt Nam lên ngôi tại đấu trường khu vực.</p><h3>Diễn biến trận đấu</h3><p>Hiệp 1 diễn ra cân bằng khi cả hai đội đều chơi thận trọng. Phút 32, tiền đạo Nguyễn Văn B mở tỷ số cho Việt Nam với cú sút xa đẹp mắt từ ngoài vòng cấm. Sang hiệp 2, Thái Lan gỡ hòa ở phút 67 sau tình huống lộn xộn trước khung thành đội Việt Nam.</p><figure class=\"media\"><div data-oembed-url=\"https://youtu.be/X3M0r32_nhc?si=gEMmN--7m51IXzhu\"><div style=\"position: relative; padding-bottom: 100%; height: 0; padding-bottom: 56.2493%;\"><iframe src=\"https://www.youtube.com/embed/X3M0r32_nhc\" style=\"position: absolute; width: 100%; height: 100%; top: 0; left: 0;\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen=\"\"></iframe></div></div></figure><p>Đến phút 89, hậu vệ Trần Văn C bất ngờ dâng cao và ghi bàn thắng quyết định bằng cú đánh đầu hiểm hóc, ấn định chiến thắng nghẹt thở 2-1 cho đoàn quân áo đỏ. Cả sân vận động như nổ tung trong khoảnh khắc lịch sử này.</p><h3>Những con số biết nói</h3><p>5 trận bất bại trên hành trình đến ngôi vô địch</p><p>12 bàn thắng ghi được, chỉ để lọt lưới 3 bàn</p><p>21 cầu thủ tham dự, độ tuổi trung bình 22.4</p><p style=\"text-align:right;\">\"Trận đấu sẽ đi vào lịch sử bóng đá nước nhà. Các em xứng đáng với tấm HCV này.\"</p>', 'backend/api/upload/articles/article_6aabfce652ee5_1789656294.jpg', 4, 2, 4, 1, 'published', NULL, 18450, '2026-09-18 00:37:57', '2026-09-12 21:00:00', '2026-09-18 00:37:57'),
(3, 'Giá vàng trong nước vượt 120 triệu đồng/lượng, lập đỉnh lịch sử', 'gia-vang-trong-nuoc-vuot-120-trieu-dong-luong-lap-dinh-lich-su', 'Sáng nay, giá vàng SJC niêm yết ở mức 120.5 triệu đồng/lượng, mức cao nhất từ trước tới nay.', '<p>Sáng nay (10/09), giá vàng SJC trong nước chính thức vượt mốc <strong>120 triệu đồng/lượng</strong>, mức cao nhất từ trước tới nay, tăng 2.5 triệu so với phiên giao dịch hôm qua. Đây là mức tăng mạnh nhất trong vòng 3 tháng trở lại đây.</p><h3>Diễn biến giá vàng sáng nay</h3><ol><li>Vàng SJC tại TP.HCM: mua vào 118 triệu - bán ra 120.5 triệu đồng/lượng</li><li>Vàng nhẫn 9999: mua vào 115 triệu - bán ra 117 triệu đồng/lượng</li><li>Vàng thế giới: 2,850 USD/oz, tăng 1.8% trong 24 giờ qua</li></ol><p>Theo đại diện một số tiệm vàng lớn tại Hà Nội, lượng người đến giao dịch tăng đột biến, nhiều nơi rơi vào tình trạng <strong>cháy hàng</strong> cục bộ ở chiều bán ra. Trung bình mỗi khách hàng mua từ 1-2 chỉ, cá biệt có khách mua cả cây vàng.</p><p>Nguyên nhân chính được cho là do căng thẳng địa chính trị leo thang ở Trung Đông, cùng với việc Cục Dự trữ Liên bang Mỹ (Fed) phát tín hiệu sẽ cắt giảm lãi suất trong quý 4. Giới phân tích dự báo giá vàng có thể còn tiếp tục tăng trong ngắn hạn.</p>', 'backend/api/upload/articles/article_6aabfdb1142b7_1789656497.jpg', 4, 3, 2, 0, 'published', NULL, 11600, '2026-09-16 09:15:00', '2026-09-11 08:30:00', '2026-09-16 09:15:00'),
(4, 'Hà Nội khánh thành tuyến metro số 5, kết nối trung tâm với sân bay Nội Bài', 'ha-noi-khanh-thanh-tuyen-metro-so-5-ket-noi-trung-tam-voi-san-bay-noi-bai', 'Tuyến metro dài 38km với 20 nhà ga chính thức đi vào hoạt động, giảm tải giao thông đáng kể.', '<p>Sáng nay, UBND TP Hà Nội chính thức khánh thành và đưa vào vận hành thương mại tuyến metro số 5, kết nối trung tâm thành phố với sân bay quốc tế Nội Bài. Đây là tuyến metro thứ ba của thủ đô đi vào hoạt động, sau tuyến Cát Linh - Hà Đông và Nhổn - Ga Hà Nội.</p><h4>Lộ trình tuyến</h4><p>Tuyến metro số 5 có tổng chiều dài <strong>38km</strong> với 20 nhà ga, đi qua các quận trọng điểm như Ba Đình, Tây Hồ, Bắc Từ Liêm và huyện Đông Anh. Thời gian di chuyển từ Hồ Tây đến sân bay Nội Bài rút ngắn còn <strong>35 phút</strong>, thay vì 1-1.5 giờ đi xe buýt hoặc ô tô cá nhân như trước. Đây được xem là bước đột phá trong việc giải quyết ùn tắc giao thông của thành phố.</p><figure class=\"image\"><img src=\"../../backend/api/upload/articles/article_6aabfe02dd31f_1789656578.jpg\"></figure><p>Với công suất vận chuyển ước tính 500,000 lượt khách/ngày đêm, tuyến metro này được kỳ vọng giảm tải đáng kể cho trục đường Võ Nguyên Giáp - Võ Chí Công và góp phần giảm phát thải CO2 của thành phố. Theo tính toán của Sở Giao thông Vận tải, tuyến metro có thể giúp giảm 45,000 tấn khí thải mỗi năm.</p><p>Độc giả có thể tra cứu thông tin chi tiết về lịch trình, giá vé và các ga dừng tại <a href=\"https://hanoimetro.net.vn\"><i><u>website chính thức Hanoi Metro</u></i></a>.</p>', 'backend/api/upload/articles/article_6aabfe3344b00_1789656627.jpg', 4, 3, 1, 0, 'published', NULL, 6750, '2026-09-15 10:00:00', '2026-09-09 08:45:00', '2026-09-15 10:00:00'),
(5, 'Bão số 8 đổ bộ miền Trung, cảnh báo lũ khẩn cấp', 'bao-so-8-do-bo-mien-trung-canh-bao-lu-khan-cap', 'Bão Kajiki dự kiến đổ bộ đêm nay với sức gió giật cấp 12-13, ảnh hưởng 6 tỉnh miền Trung.', '<h3>Tình hình khẩn cấp</h3><p>Theo Trung tâm Dự báo Khí tượng Thủy văn Quốc gia, bão số 8 (tên quốc tế Kajiki) đang di chuyển nhanh vào bờ biển miền Trung với sức gió giật cấp 12-13. Dự kiến bão sẽ đổ bộ vào đất liền trong đêm nay, ảnh hưởng trực tiếp đến các tỉnh từ Quảng Bình đến Quảng Ngãi.</p><p>Các tỉnh đã khẩn trương sơ tán hơn <strong>45,000 dân</strong> khỏi vùng nguy hiểm. Nhiều trường học được lệnh cho học sinh nghỉ học từ chiều nay. Các tuyến đường ven biển bị cấm lưu thông để đảm bảo an toàn.</p><p>Theo dự báo, lượng mưa phổ biến 200-400mm, có nơi trên 500mm, nguy cơ lũ quét và sạt lở đất ở vùng núi rất cao. Người dân được khuyến cáo hạn chế ra đường, không đi qua các khu vực ngập sâu.</p>', 'backend/api/upload/articles/article_6aabfe8b742a2_1789656715.jpg', 4, NULL, 1, 0, 'pending', NULL, 0, NULL, '2026-09-12 22:20:09', '2026-09-18 10:00:00'),
(6, 'U23 Việt Nam chuẩn bị cho vòng loại Olympic 2028', 'u23-viet-nam-chuan-bi-cho-vong-loai-olympic-2028', 'Đội tuyển U23 hội quân trở lại, đặt mục tiêu vượt qua vòng loại Olympic 2028 tại Los Angeles.', '<p>Đội tuyển U23 Việt Nam đã hội quân trở lại để chuẩn bị cho vòng loại Olympic 2028 khu vực châu Á, dự kiến diễn ra vào tháng 3/2027. Đây là giải đấu quan trọng bậc nhất trong chu kỳ 4 năm, mở ra cơ hội cho bóng đá Việt Nam góp mặt tại đấu trường Olympic.</p><ol><li>Tập trung đợt 1: từ 15/09 tại Trung tâm PVF Hưng Yên</li><li>Đá giao hữu với U23 Nhật Bản và U23 Hàn Quốc trong tháng 10</li><li>Công bố danh sách chính thức 30 cầu thủ vào cuối tháng 11</li></ol><p>HLV trưởng cho biết mục tiêu của đội là <strong>vượt qua vòng loại và tiến sâu tại vòng chung kết Olympic 2028</strong> tổ chức tại Los Angeles (Mỹ). Ông cũng nhấn mạnh sẽ tạo điều kiện cho các cầu thủ trẻ thể hiện mình, hướng tới mục tiêu dài hạn là World Cup 2030.</p>', 'backend/api/upload/articles/article_6aabff1ad7068_1789656858.jpg', 4, NULL, 4, 0, 'pending', NULL, 0, NULL, '2026-09-12 22:22:23', '2026-09-18 09:30:00'),
(7, 'Kinh tế xanh - xu hướng tất yếu của thập kỷ 2026', 'kinh-te-xanh-xu-huong-tat-yeu-cua-thap-ky-2026', 'Mô hình kinh tế xanh đang trở thành xu hướng toàn cầu, mở ra cơ hội lớn cho Việt Nam.', '<h3>Kinh tế xanh là gì?</h3><p>Kinh tế xanh (Green Economy) là mô hình phát triển hướng tới <strong>giảm phát thải carbon</strong>, sử dụng hiệu quả tài nguyên thiên nhiên và đảm bảo công bằng xã hội. Đây được xem là xu hướng tất yếu của kinh tế toàn cầu trong thập kỷ tới, đặc biệt khi các quốc gia đang nỗ lực thực hiện cam kết Net Zero.</p><ul><li>Năng lượng tái tạo thay thế nhiên liệu hóa thạch</li><li>Sản xuất tuần hoàn, giảm rác thải và tái chế</li><li>Giao thông xanh, xe điện phổ biến</li><li>Nông nghiệp hữu cơ, thân thiện môi trường</li></ul><p>Một số chuyên gia cho rằng Việt Nam có tiềm năng lớn để phát triển kinh tế xanh nhờ vị trí địa lý và nguồn tài nguyên tái tạo dồi dào.</p>', NULL, 4, NULL, 2, 0, 'draft', NULL, 0, NULL, '2026-09-12 22:25:13', '2026-09-17 20:30:00'),
(8, 'Tin nóng: Nội bộ CLB Hà Nội có biến động lớn', 'tin-nong-noi-bo-clb-ha-noi-co-bien-dong-lon', 'Một số nguồn tin cho biết CLB Hà Nội đang có biến động về nhân sự và định hướng chuyển nhượng.', '<p>Theo thông tin từ một số nguồn tin nội bộ, CLB Hà Nội được cho là đang có những biến động lớn về mặt nhân sự cũng như định hướng chuyển nhượng trong mùa giải 2026.</p><p>Cụ thể, một số trụ cột được cho là đã bày tỏ nguyện vọng ra đi sau khi hợp đồng đáo hạn. Ban lãnh đạo CLB được cho là đang xem xét thay đổi ban huấn luyện để chuẩn bị cho mùa giải mới.</p><p>Hiện tại, phía CLB chưa đưa ra bất kỳ phản hồi chính thức nào về vấn đề này. Người hâm mộ đang chờ đợi thông tin xác thực từ câu lạc bộ.</p>', 'backend/api/upload/articles/article_6aabff955832f_1789656981.jpg', 4, NULL, 4, 0, 'rejected', 'Cần bổ sung nguồn tin xác thực từ CLB. Thông tin hiện tại chỉ là tin đồn từ MXH.', 0, NULL, '2026-09-12 22:26:53', '2026-09-17 20:00:00'),
(9, 'Cựu lãnh đạo ngân hàng X bị khởi tố vì làm trái quy định', 'cuu-lanh-dao-ngan-hang-x-bi-khoi-to-vi-lam-trai-quy-dinh', 'Cựu lãnh đạo ngân hàng TMCP X bị cáo buộc gây thiệt hại hàng nghìn tỷ đồng cho nhà nước.', '<p>Cơ quan Cảnh sát Điều tra vừa khởi tố và bắt tạm giam một cựu lãnh đạo ngân hàng thương mại cổ phần X với cáo buộc <strong>cố ý làm trái quy định về quản lý tài chính ngân hàng</strong>, gây thiệt hại hàng nghìn tỷ đồng cho nhà nước.</p><p>Theo kết luận điều tra ban đầu, từ năm 2019 đến 2022, bị can đã chỉ đạo cấp dưới phê duyệt nhiều khoản vay không đủ điều kiện, đồng thời che giấu nợ xấu của một số doanh nghiệp lớn. Số tiền thiệt hại ước tính lên tới hơn 3,500 tỷ đồng.</p><p>Phiên tòa sơ thẩm dự kiến sẽ diễn ra trong vòng 2 tháng tới tại TAND TP.HCM. Nhiều cựu lãnh đạo cấp cao khác của ngân hàng này cũng đang bị triệu tập để phục vụ điều tra.</p>', 'backend/api/upload/articles/article_6aabffde7ea1c_1789657054.jpg', 4, 2, 1, 0, 'hidden', NULL, 3100, '2026-09-13 14:20:00', '2026-09-12 22:28:54', '2026-09-13 14:20:00'),
(10, 'ChatGPT-6 chính thức ra mắt Đông Nam Á: Bước ngoặt AI cho khu vực', 'chatgpt-6-chinh-thuc-ra-mat-dong-nam-a-buoc-ngoat-ai-cho-khu-vuc', 'OpenAI vừa công bố phiên bản ChatGPT-6 với khả năng suy luận vượt trội, mở ra làn sóng ứng dụng mới cho doanh nghiệp Việt Nam.', '<p>OpenAI mới đây đã chính thức công bố phiên bản ChatGPT-6 tại thị trường Đông Nam Á sau nhiều tháng thử nghiệm nội bộ. Đây được xem là bước tiến lớn của ngành AI toàn cầu, hứa hẹn mở ra làn sóng ứng dụng mới cho doanh nghiệp và người dùng trong khu vực.</p><h3 style=\"text-align:center;\">ChatGPT-6 có gì mới?</h3><figure class=\"image\"><img src=\"../../backend/api/upload/articles/article_6aac001154084_1789657105.jpg\" alt=\"ChatGPT-6 interface with multimodal capabilities\"><figcaption>Giao diện ChatGPT-6 với khả năng xử lý đa phương thức</figcaption></figure><p>So với phiên bản tiền nhiệm, ChatGPT-6 được trang bị khả năng <strong>suy luận đa bước</strong> và <strong>hiểu ngữ cảnh dài tới 1 triệu token</strong>, gấp 10 lần so với ChatGPT-5. Điều này cho phép xử lý các tác vụ phức tạp như phân tích tài liệu pháp lý dài hàng trăm trang, viết code cho dự án lớn, hoặc mô phỏng nghiên cứu khoa học.</p><h3>Ứng dụng cho doanh nghiệp Việt</h3><p>Theo đại diện OpenAI khu vực châu Á - Thái Bình Dương, ChatGPT-6 sẽ được cung cấp tại Việt Nam với mức giá ưu đãi cho doanh nghiệp vừa và nhỏ. Các lĩnh vực được kỳ vọng hưởng lợi nhiều nhất bao gồm <strong>thương mại điện tử</strong>, <strong>fintech </strong>và <strong>giáo dục trực tuyến</strong>.</p>', 'backend/api/upload/articles/article_6aac007a77a7f_1789657210.jpg', 5, 2, 3, 1, 'published', NULL, 15280, '2026-09-18 06:30:00', '2026-09-12 11:15:00', '2026-09-18 06:30:00'),
(11, 'Bộ GD&ĐT công bố phương án thi tốt nghiệp THPT 2027: 4 môn bắt buộc', 'bo-gd-dt-cong-bo-phuong-an-thi-tot-nghiep-thpt-2027-4-mon-bat-buoc', 'Học sinh lớp 12 sẽ thi 4 môn bắt buộc gồm Toán, Ngữ văn, Ngoại ngữ và một môn tự chọn.', '<p>Bộ Giáo dục và Đào tạo vừa chính thức công bố phương án thi tốt nghiệp THPT từ năm 2027, với nhiều thay đổi quan trọng so với phương án hiện hành. Theo đó, học sinh sẽ thi 4 môn bắt buộc thay vì 6 môn như trước đây.</p><h4>Danh sách môn thi</h4><ul><li>Toán (bắt buộc)</li><li>Ngữ văn (bắt buộc)</li><li>Ngoại ngữ (bắt buộc)</li><li>Một môn tự chọn trong các môn: Vật lý, Hóa học, Sinh học, Lịch sử, Địa lý, Giáo dục kinh tế và pháp luật, Tin học, Công nghệ</li></ul><p>Đại diện Bộ GD&amp;ĐT cho biết phương án mới nhằm <strong>giảm áp lực thi cử</strong> cho học sinh, đồng thời tăng tính tự chủ trong việc lựa chọn môn học phù hợp với định hướng nghề nghiệp. Kỳ thi sẽ được tổ chức trên máy tính ở một số địa phương có đủ điều kiện, dự kiến mở rộng toàn quốc vào năm 2030.</p>', 'backend/api/upload/articles/article_6aac00dd1e6ca_1789657309.jpg', 5, 3, 6, 0, 'published', NULL, 3890, '2026-09-14 14:15:00', '2026-09-07 13:30:00', '2026-09-14 14:15:00'),
(12, 'Startup AI Việt gọi vốn thành công 50 triệu USD từ quỹ Nhật Bản', 'startup-ai-viet-goi-von-thanh-cong-50-trieu-usd-tu-quy-nhat-ban', 'Đây là thương vụ gọi vốn lớn nhất trong lĩnh vực AI tại Việt Nam kể từ đầu năm 2026.', '<p>Một startup AI của Việt Nam vừa công bố gọi vốn thành công <strong>50 triệu USD</strong> trong vòng Series B do một quỹ đầu tư mạo hiểm hàng đầu Nhật Bản dẫn dắt. Đây là thương vụ gọi vốn lớn nhất trong lĩnh vực AI tại Việt Nam kể từ đầu năm 2026.</p><p>Startup này hoạt động trong lĩnh vực phát triển các giải pháp AI cho ngành <strong>logistics</strong> và <strong>chuỗi cung ứng</strong>, giúp tối ưu hóa lộ trình vận chuyển và dự báo nhu cầu hàng hóa với độ chính xác lên tới 95%. Hiện công ty đã có hơn 200 khách hàng doanh nghiệp tại 5 quốc gia Đông Nam Á.</p><blockquote><p>\"Chúng tôi tin rằng AI Việt Nam có thể vươn ra thế giới. Số vốn này sẽ giúp chúng tôi mở rộng sang thị trường Nhật Bản và Hàn Quốc trong vòng 18 tháng tới.\"<br>- Nhà sáng lập kiêm CEO startup</p></blockquote><p>Với khoản đầu tư này, startup dự kiến sẽ tăng gấp ba đội ngũ kỹ sư AI trong năm 2027, đồng thời mở thêm văn phòng tại Tokyo và Seoul.</p>', 'backend/api/upload/articles/article_6aac012d986d5_1789657389.jpg', 5, 2, 3, 0, 'published', NULL, 4210, '2026-09-13 09:20:00', '2026-09-07 08:00:00', '2026-09-13 09:20:00'),
(13, 'iPhone 18 Pro Max lộ diện với chip 2nm', 'iphone-18-pro-max-lo-dien-voi-chip-2nm', 'Rò rỉ mới nhất cho thấy iPhone 18 Pro Max sẽ trang bị chip A20 Pro sản xuất trên tiến trình 2nm, hiệu năng vượt trội.', '<p>Theo thông tin rò rỉ từ chuỗi cung ứng Đài Loan, iPhone 18 Pro Max dự kiến ra mắt vào tháng 9/2026 sẽ được trang bị chip <strong>A20 Pro</strong> sản xuất trên tiến trình 2nm đầu tiên của ngành bán dẫn. Đây được kỳ vọng là bước đột phá về hiệu năng và tiết kiệm điện.</p><h4>Những nâng cấp đáng chú ý</h4><ul><li>Chip A20 Pro 2nm, hiệu năng tăng 25% so với A19 Pro</li><li>Camera chính 200MP với cảm biến lớn hơn 30%</li><li>Pin dung lượng 5,200 mAh, sạc nhanh 60W</li><li>Màn hình ProMotion 144Hz</li></ul><p>Với tiến trình 2nm, Apple dự kiến sẽ tiếp tục dẫn đầu về hiệu năng CPU đơn nhân và khả năng xử lý AI on-device. Mức giá dự kiến khởi điểm từ 1,299 USD cho phiên bản 256GB.</p>', 'backend/api/upload/articles/article_6aac0171a7e1b_1789657457.png', 5, NULL, 3, 0, 'pending', NULL, 0, NULL, '2026-09-12 22:39:24', '2026-09-17 15:00:00'),
(14, 'Review chi tiết Galaxy S27 Ultra', 'review-chi-tiet-galaxy-s27-ultra', 'Đánh giá chi tiết flagship mới nhất của Samsung sau 2 tuần trải nghiệm thực tế.', '<p>Samsung Galaxy S27 Ultra vừa được ra mắt với nhiều nâng cấp đáng chú ý. Trong bài review này, tôi sẽ chia sẻ trải nghiệm thực tế sau 2 tuần sử dụng máy.</p><p>&nbsp;</p>', NULL, 5, NULL, 3, 0, 'draft', NULL, 0, NULL, '2026-09-12 22:48:35', '2026-09-17 21:30:00'),
(15, 'Đánh giá iPhone 15 sau 2 năm sử dụng', 'danh-gia-iphone-15-sau-2-nam-su-dung', 'Nhìn lại chiếc iPhone 15 sau 2 năm ra mắt - liệu còn đáng mua ở thời điểm hiện tại?', '<p>iPhone 15 đã ra mắt được hơn 2 năm, và đến thời điểm hiện tại vẫn là một trong những lựa chọn phổ biến trong phân khúc tầm trung cao cấp. Trong bài viết này, chúng ta cùng nhìn lại những điểm mạnh và điểm yếu của máy.</p><p>Về thiết kế, iPhone 15 vẫn giữ ngôn ngữ thiết kế quen thuộc với khung viền nhôm và mặt lưng kính. Màn hình OLED 6.1 inch cho chất lượng hiển thị tốt. Hiệu năng từ chip A16 Bionic vẫn đáp ứng tốt các tác vụ hàng ngày.</p><p>Tuy nhiên, ở thời điểm hiện tại, iPhone 15 đã bộc lộ một số hạn chế như pin xuống cấp sau 2 năm, tốc độ sạc chậm so với các đối thủ Android cùng giá.</p>', 'backend/api/upload/articles/article_6aac01bcbbfa6_1789657532.jpg', 5, NULL, 3, 0, 'rejected', 'Tìm thêm dẫn chứng từ những người dùng iPhone 15 khác', 0, NULL, '2026-09-12 22:50:27', '2026-09-17 19:00:00'),
(16, 'Drama showbiz: Ca sĩ Y tố cáo quản lý chiếm đoạt', 'drama-showbiz-ca-si-y-to-cao-quan-ly-chiem-doat', 'Sự việc gây xôn xao dư luận khi nữ ca sĩ Y bất ngờ tố cáo quản lý cũ chiếm đoạt số tiền lớn.', '<p>Sự việc gây xôn xao dư luận những ngày qua khi nữ ca sĩ Y bất ngờ đăng đàn tố cáo quản lý cũ của mình chiếm đoạt số tiền lớn từ các show diễn trong suốt 3 năm hợp tác.</p><p>Theo chia sẻ của nữ ca sĩ, số tiền bị chiếm đoạt ước tính lên tới <strong>hàng tỷ đồng</strong>, bao gồm tiền cát-xê, tiền quảng cáo và doanh thu từ các sản phẩm âm nhạc. Cô cho biết đã nhiều lần yêu cầu đối chiếu sổ sách nhưng không được đáp ứng.</p><p>Phía quản lý cũ hiện chưa đưa ra phản hồi chính thức. Sự việc đang thu hút sự quan tâm lớn từ cộng đồng mạng, nhiều nghệ sĩ khác cũng lên tiếng chia sẻ về vấn đề minh bạch tài chính trong showbiz Việt.</p>', 'backend/api/upload/articles/article_6aac01e97ab46_1789657577.png', 5, 2, 5, 0, 'hidden', NULL, 7450, '2026-09-17 16:00:00', '2026-09-12 22:52:31', '2026-09-17 16:00:00'),
(17, 'Phim \"Đất rừng phương Nam 2\" lập kỷ lục phòng vé với 200 tỷ đồng', 'phim-dat-rung-phuong-nam-2-lap-ky-luc-phong-ve-voi-200-ty-dong', 'Sau 2 tuần công chiếu, phần 2 của Đất rừng phương Nam đã vượt mốc 200 tỷ đồng doanh thu.', '<p>Bộ phim <i>Đất rừng phương Nam 2</i> vừa chính thức vượt mốc doanh thu <strong>200 tỷ đồng</strong> sau 2 tuần công chiếu, trở thành phim Việt có doanh thu cao nhất năm 2026 tính đến thời điểm hiện tại. Đây là thành tích đáng nể trong bối cảnh thị trường phim ảnh đang cạnh tranh gay gắt.</p><h3>Dàn diễn viên</h3><p>Phim quy tụ dàn diễn viên thực lực với sự tham gia của <strong>diễn viên Trấn Thành</strong>, <strong>diễn viên Kaity Nguyễn</strong> và <strong>diễn viên Tuấn Trần</strong>. Đây là lần thứ hai bộ ba này hợp tác sau thành công của phần 1 cách đây 3 năm.</p><figure class=\"image\"><img src=\"../../backend/api/upload/articles/article_6aac02428be25_1789657666.webp\"></figure><blockquote><p>\"Phần 2 là một thử thách lớn với toàn bộ ê-kíp. Chúng tôi mất gần 3 năm để hoàn thiện kịch bản và 8 tháng quay chính. Thành công hôm nay là nhờ sự ủng hộ của khán giả.\"<br>- Đạo diễn Nguyễn Quang Dũng</p></blockquote><h3>Doanh thu và đánh giá</h3><p>Theo số liệu từ Box Office Vietnam, phim đạt doanh thu 80 tỷ trong 3 ngày đầu, sau đó tăng tốc nhờ hiệu ứng truyền miệng tích cực. Điểm đánh giá trung bình trên các nền tảng hiện ở mức 8.2/10.</p>', 'backend/api/upload/articles/article_6aac02583b4dd_1789657688.webp', 6, 2, 5, 0, 'published', NULL, 8920, '2026-09-17 17:30:00', '2026-09-10 15:10:00', '2026-09-17 17:30:00'),
(18, 'Học phí đại học công lập tăng 15% năm học 2026-2027', 'hoc-phi-dai-hoc-cong-lap-tang-15-nam-hoc-2026-2027', 'Nhiều trường đại học công lập đã công bố mức học phí mới, tăng trung bình 15% so với năm học trước.', '<p>Theo khảo sát mới nhất, nhiều trường đại học công lập trên cả nước đã công bố mức học phí cho năm học 2026-2027, với mức tăng trung bình <strong>15%</strong> so với năm trước. Đây là mức tăng cao nhất trong vòng 5 năm qua, gây lo ngại cho nhiều gia đình có con em chuẩn bị vào đại học.</p><h3>Mức học phí các khối ngành</h3><figure class=\"table\"><table><tbody><tr><td>Khối ngành</td><td>Học phí 2025-2026</td><td>Học phí 2026-2027</td><td>Tăng</td></tr><tr><td>Kinh tế - Quản trị</td><td>28 triệu/năm</td><td>32 triệu/năm</td><td>+14%</td></tr><tr><td>Kỹ thuật - Công nghệ</td><td>32 triệu/năm</td><td>37 triệu/năm</td><td>+16%</td></tr><tr><td>Y - Dược</td><td>55 triệu/năm</td><td>63 triệu/năm</td><td>+15%</td></tr><tr><td>Khoa học xã hội</td><td>22 triệu/năm</td><td>25 triệu/năm</td><td>+14%</td></tr></tbody></table></figure><p>&nbsp;Các trường lý giải việc tăng học phí là do <strong>chi phí đào tạo tăng</strong>, đặc biệt là các ngành có yêu cầu cao về thực hành và thí nghiệm. Bên cạnh đó, nhiều trường đang đẩy mạnh tự chủ tài chính, cần tăng nguồn thu để đầu tư cơ sở vật chất và nâng cao chất lượng giảng dạy.</p><p>Đại diện Bộ GD&amp;ĐT cho biết sẽ có nhiều chính sách hỗ trợ cho sinh viên có hoàn cảnh khó khăn, bao gồm học bổng và các gói vay ưu đãi với lãi suất thấp.</p>', 'backend/api/upload/articles/article_6aac030d22e59_1789657869.jpg', 6, NULL, 6, 0, 'pending', NULL, 0, NULL, '2026-09-12 23:38:37', '2026-09-18 08:00:00'),
(19, 'Top 10 phim Việt đáng xem 2026', 'top-10-phim-viet-dang-xem-2026', 'Điểm danh 10 bộ phim Việt Nam được đánh giá cao nhất trong năm 2026.', '<p>Năm 2026 đánh dấu sự bùng nổ của phim Việt với nhiều tác phẩm chất lượng. Dưới đây là top 10 bộ phim được đánh giá cao nhất.</p><ol><li>Đất rừng phương Nam</li><li>Mắt Biếc 2</li><li>….</li></ol>', NULL, 6, NULL, 5, 0, 'draft', NULL, 0, NULL, '2026-09-17 22:11:50', '2026-09-17 22:11:50'),
(20, 'Bí ẩn vụ mất tích tại khu du lịch Đà Lạt', 'bi-an-vu-mat-tich-tai-khu-du-lich-da-lat', 'Vụ việc một du khách mất tích bí ẩn tại khu du lịch nổi tiếng ở Đà Lạt đang gây hoang mang dư luận.', '<p>Một vụ việc gây hoang mang dư luận vừa xảy ra tại khu du lịch nổi tiếng ở Đà Lạt khi một du khách được cho là mất tích bí ẩn trong nhiều ngày.</p><p>Theo thông tin ban đầu, nạn nhân được xác định là nữ, khoảng 25-30 tuổi, đến Đà Lạt du lịch một mình. Gia đình cho biết đã mất liên lạc với nạn nhân từ ngày 5/9. Camera an ninh tại khu du lịch ghi lại hình ảnh nạn nhân đi bộ vào một khu vực vắng vẻ trước khi mất tích.</p><p>Cơ quan chức năng đang khẩn trương điều tra và tìm kiếm. Một số người dân địa phương cho rằng khu vực này có nhiều \"điều kỳ lạ\" chưa được lý giải.</p>', 'backend/api/upload/articles/article_6aac034f5acf5_1789657935.jpg', 6, NULL, 1, 0, 'rejected', 'Bài viết có dấu hiệu giật tít, xâm phạm đời tư cá nhân. Cần chỉnh sửa lại tiêu đề và nội dung.', 0, NULL, '2026-09-13 00:30:55', '2026-09-17 21:00:00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `article_tags`
--

CREATE TABLE `article_tags` (
  `article_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `article_tags`
--

INSERT INTO `article_tags` (`article_id`, `tag_id`) VALUES
(1, 1),
(1, 2),
(2, 3),
(2, 4),
(3, 1),
(3, 5),
(3, 6),
(4, 7),
(4, 8),
(5, 9),
(5, 10),
(6, 4),
(6, 11),
(6, 12),
(7, 13),
(7, 14),
(8, 4),
(8, 11),
(10, 15),
(10, 16),
(10, 17),
(11, 18),
(12, 1),
(12, 15),
(12, 17),
(13, 19),
(15, 20),
(15, 21),
(16, 22),
(16, 23),
(17, 24),
(17, 25),
(18, 26),
(18, 27);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `created_at`) VALUES
(1, 'Thời sự', 'thoi-su', 'Tin tức thời sự trong nước và quốc tế, cập nhật 24/7', '2026-09-12 14:16:00'),
(2, 'Kinh tế', 'kinh-te', 'Thị trường tài chính, chứng khoán, bất động sản, giá cả', '2026-09-12 14:16:31'),
(3, 'Công nghệ', 'cong-nghe', 'AI, chuyển đổi số, thiết bị, xu hướng công nghệ toàn cầu', '2026-09-12 14:16:54'),
(4, 'Thể thao', 'the-thao', 'Bóng đá, SEA Games, Olympic và các giải đấu quốc tế', '2026-09-12 14:17:10'),
(5, 'Văn hóa - Giải trí', 'van-hoa-giai-tri', 'Phim ảnh, âm nhạc, sự kiện văn hóa, đời sống nghệ sĩ', '2026-09-12 14:17:44'),
(6, 'Giáo dục', 'giao-duc', 'Tuyển sinh, chương trình học, chính sách giáo dục', '2026-09-12 14:19:29');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `article_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `content` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `comments`
--

INSERT INTO `comments` (`id`, `article_id`, `user_id`, `content`, `created_at`) VALUES
(1, 2, 7, 'Trận đấu quá cảm xúc! Đội tuyển U23 Việt Nam mãi đỉnh!🎉🎉🎉', '2026-09-18 01:15:00'),
(2, 10, 7, 'Hy vọng OpenAI sớm tung gói API dành riêng cho thị trường sinh viên Việt Nam với mức phí dễ tiếp cận hơn.', '2026-09-18 07:30:00'),
(3, 2, 8, 'Hiệp 1 đá hơi thận trọng nhưng hiệp 2 ban huấn luyện thay người quá hợp lý. Tinh thần chiến đấu tuyệt vời!', '2026-09-18 01:45:00'),
(4, 2, 9, 'Bán áo đấu U23 chính hãng giảm giá 50% chỉ hôm nay! Anh em bấm vào link nhận ưu đãi ngay: https://shop-thethao-fake.xyz/sale', '2026-09-18 02:10:00'),
(5, 10, 9, 'Khả năng hiểu ngữ cảnh 1 triệu token quá ấn tượng. Nếu tích hợp vào quy trình phân tích văn bản hợp đồng pháp lý của doanh nghiệp thì tiết kiệm được rất nhiều thời gian.', '2026-09-18 08:00:00'),
(6, 17, 8, 'Cái bọn nghệ sĩ toàn lũ lừa đảo, phim rác rưởi mà thổi phồng 200 tỷ, tẩy chay hết đi lũ ngu ngốc!', '2026-09-17 20:30:00'),
(7, 1, 9, 'Tăng trưởng 7.2% trong bối cảnh kinh tế thế giới khó khăn là nỗ lực rất lớn của Chính phủ và cộng đồng doanh nghiệp.', '2026-09-12 09:15:00'),
(8, 1, 8, 'Công nghiệp chế biến chế tạo phục hồi tốt, nhưng cũng cần chú ý kiểm soát lạm phát và giá cả tiêu dùng.', '2026-09-12 10:45:00'),
(9, 1, 7, 'Số liệu rất tích cực, hy vọng thu nhập và việc làm của người lao động cũng sẽ tăng trưởng tương ứng trong các quý tới.', '2026-09-12 14:20:00'),
(10, 3, 7, 'Giá vàng tăng chóng mặt quá, mới tháng trước 115 triệu giờ đã vọt lên 120 triệu rồi. Không biết có nên mua lúc này không anh em?', '2026-09-16 10:30:00'),
(11, 3, 8, 'Căng thẳng địa chính trị còn kéo dài thì vàng vẫn là kênh trú ẩn an toàn số 1. SJC cháy hàng là điều dễ hiểu.', '2026-09-16 11:15:00'),
(12, 3, 9, 'Dự báo Fed hạ lãi suất quý 4 thì giá vàng thế giới khả năng còn lập thêm nhiều đỉnh mới.', '2026-09-16 15:40:00'),
(13, 4, 8, 'Sáng nay mình đi thử từ ga Hồ Tây lên Nội Bài đúng 35 phút, tàu chạy êm ru không còn cảnh tắc đường ở cầu Nhật Tân nữa, quá tuyệt!', '2026-09-15 11:20:00'),
(14, 4, 9, 'Hà Nội đang thay da đổi thịt từng ngày về giao thông công cộng. Mong tuyến metro tiếp theo sớm khởi công.', '2026-09-15 13:05:00'),
(15, 11, 7, 'Giảm xuống 4 môn thi là quyết định rất nhân văn, giảm bớt áp lực ôn thi nặng nề cho các cháu học sinh.', '2026-09-14 15:30:00'),
(16, 11, 8, 'Ủng hộ thi trắc nghiệm trên máy tính, minh bạch và có kết quả nhanh hơn rất nhiều.', '2026-09-14 17:10:00'),
(17, 12, 9, 'Tự hào trí tuệ công nghệ Việt Nam! 50 triệu USD cho vòng Series B là con số khủng cho một startup logistics AI.', '2026-09-13 10:40:00'),
(18, 12, 7, 'Tối ưu hóa được lộ trình và giảm 95% sai số dự báo thì các tập đoàn bán lẻ lớn sẽ tranh nhau mua giải pháp này ngay.', '2026-09-13 11:55:00'),
(19, 2, 9, 'Cả quán cà phê mình ngồi xem lúc Văn C ghi bàn phút 89 đều nhảy cẫng lên ôm nhau hò reo. Khoảnh khắc nhớ đời!', '2026-09-18 02:35:00'),
(20, 17, 7, 'Mình vừa đi xem về hôm qua, bối cảnh sông nước miền Tây quay đại cảnh flycam đẹp xuất sắc, âm nhạc cũng rất xúc động.', '2026-09-17 21:40:00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `favorites`
--

CREATE TABLE `favorites` (
  `user_id` int(11) NOT NULL,
  `article_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `favorites`
--

INSERT INTO `favorites` (`user_id`, `article_id`, `created_at`) VALUES
(7, 1, '2026-09-12 11:00:00'),
(7, 2, '2026-09-18 09:39:23'),
(7, 4, '2026-09-15 15:00:00'),
(7, 10, '2026-09-18 09:39:40'),
(7, 11, '2026-09-14 16:00:00'),
(8, 2, '2026-09-18 08:00:00'),
(8, 3, '2026-09-16 14:00:00'),
(8, 4, '2026-09-15 12:30:00'),
(8, 17, '2026-09-17 22:00:00'),
(9, 1, '2026-09-12 11:30:00'),
(9, 2, '2026-09-18 03:00:00'),
(9, 3, '2026-09-16 16:00:00'),
(9, 10, '2026-09-18 10:00:00'),
(9, 12, '2026-09-13 12:00:00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `site_settings`
--

CREATE TABLE `site_settings` (
  `id` int(11) NOT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `short_description` text DEFAULT NULL,
  `social_links` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`social_links`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `site_settings`
--

INSERT INTO `site_settings` (`id`, `contact_email`, `contact_phone`, `address`, `short_description`, `social_links`) VALUES
(1, 'lienhe@machtin.vn', '028 1234 5678', '02 Võ Oanh, phường Thạnh Mỹ Tây, TP. Hồ Chí Minh', 'Bắt mạch dòng chảy tin tức Việt Nam - cập nhật liên tục, xác thực trước khi đăng tải.', '{\"facebook\":\"https://www.facebook.com/profile.php?id=61594146516957\",\"youtube\":\"https://www.youtube.com/channel/UCkywEeJ0k_g-jMWnBp-qhqQ\",\"tiktok\":\"https://www.tiktok.com/@machtin.24h\"}');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tags`
--

CREATE TABLE `tags` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `tags`
--

INSERT INTO `tags` (`id`, `name`, `slug`, `created_at`) VALUES
(1, 'Kinh tế vĩ mô', 'kinh-te-vi-mo', '2026-09-12 22:00:21'),
(2, 'GDP 2026', 'gdp-2026', '2026-09-12 22:00:21'),
(3, 'SEA Games', 'sea-games', '2026-09-12 22:13:01'),
(4, 'Bóng Đá Việt Nam', 'bong-da-viet-nam', '2026-09-12 22:13:01'),
(5, 'Giá vàng', 'gia-vang', '2026-09-12 22:15:24'),
(6, 'SJC', 'sjc', '2026-09-12 22:15:24'),
(7, 'Giao thông', 'giao-thong', '2026-09-12 22:18:04'),
(8, 'Metro', 'metro', '2026-09-12 22:18:04'),
(9, 'Khí hậu', 'khi-hau', '2026-09-12 22:20:09'),
(10, 'Bão', 'bao', '2026-09-12 22:20:09'),
(11, 'U23', 'u23', '2026-09-12 22:22:23'),
(12, 'Olympic 2028', 'olympic-2028', '2026-09-12 22:22:23'),
(13, 'Môi trường', 'moi-truong', '2026-09-12 22:25:13'),
(14, 'Năng lượng xanh', 'nang-luong-xanh', '2026-09-12 22:25:13'),
(15, 'AI', 'ai', '2026-09-12 22:33:10'),
(16, 'ChatGPT-6', 'chatgpt-6', '2026-09-12 22:33:10'),
(17, 'Chuyển đổi số', 'chuyen-doi-so', '2026-09-12 22:33:10'),
(18, 'Tuyển sinh 2027', 'tuyen-sinh-2027', '2026-09-12 22:35:59'),
(19, 'iPhone18', 'iphone18', '2026-09-12 22:39:24'),
(20, 'review', 'review', '2026-09-12 22:50:27'),
(21, 'iPhone', 'iphone', '2026-09-12 22:50:27'),
(22, 'Showbiz', 'showbiz', '2026-09-12 22:52:31'),
(23, 'Ca sĩ Y', 'ca-si-y', '2026-09-12 22:52:31'),
(24, 'Phim Việt', 'phim-viet', '2026-09-12 23:31:09'),
(25, 'Đất rừng phương Nam', 'dat-rung-phuong-nam', '2026-09-12 23:31:09'),
(26, 'Học phí', 'hoc-phi', '2026-09-12 23:40:53'),
(27, 'Đại học', 'dai-hoc', '2026-09-12 23:40:53');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `role` enum('user','reporter','editor','admin') DEFAULT 'user',
  `status` enum('active','locked') DEFAULT 'active',
  `lock_reason` text DEFAULT NULL,
  `locked_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `full_name`, `avatar`, `bio`, `role`, `status`, `lock_reason`, `locked_at`, `created_at`) VALUES
(1, 'admin', 'admin@gmail.com', '$2y$10$DUf2ua4NngfKSGe/KncIPuL36kp.tCzvaKsPGAsqknal9/Rroa5rS', 'Nguyễn Quản Trị', 'backend/api/upload/avatars/avatar_6aa5290a79cc6_1789208842.jpg', 'Quản trị viên hệ thống Mạch Tin. Phụ trách vận hành, kiểm duyệt và đảm bảo chất lượng nội dung toàn tòa soạn.', 'admin', 'active', NULL, NULL, '2026-09-12 13:31:36'),
(2, 'editor_1', 'editor1@gmail.com', '$2y$10$Au1jOu8eQH6E6XLNlSdcie8tSdBqO1tMzDlqeM5LCQ6sStgt49mjG', 'Huỳnh Biên Tập Một', 'backend/api/upload/avatars/avatar_6aa52edf48702_1789210335.jpg', 'Biên tập viên 8 năm kinh nghiệm trong lĩnh vực báo chí số, chuyên sâu về thị trường tài chính và xu hướng công nghệ Đông Nam Á.', 'editor', 'active', NULL, NULL, '2026-09-12 13:35:15'),
(3, 'editor_2', 'editor2@gmail.com', '$2y$10$66ZjRI/EfsvSGr7mp4b53.oW4HV0TQxBS.n7OJwGNgxqu95BZhgfq', 'Huỳnh Biên Tập Hai', NULL, 'Theo dõi các vấn đề xã hội, chính sách và biến động thời cuộc.', 'editor', 'active', NULL, NULL, '2026-09-12 13:36:10'),
(4, 'reporter_1', 'reporter1@gmail.com', '$2y$10$IH4eJL6qkEVSAeVb8N0iu.le2ryllflWOUYVTKzJV8SglqZjplzGa', 'Trần Phóng Viên Một', 'backend/api/upload/avatars/avatar_6aa52f9e4ca16_1789210526.jpg', 'Phóng viên thời sự với hơn 5 năm tác nghiệp tại TP.HCM và Đồng bằng sông Cửu Long. Đam mê theo đuổi các đề tài về môi trường, biến đổi khí hậu và đời sống người dân.', 'reporter', 'active', NULL, NULL, '2026-09-12 13:48:53'),
(5, 'reporter_2', 'reporter2@gmail.com', '$2y$10$MJxYl6FBwQmqr8p.EksrruNJ2hgmIslS5IJcim8EEeqWCL0NyIe6S', 'Trần Phóng Viên Hai', 'backend/api/upload/avatars/avatar_6aa52fbf49c7f_1789210559.jpg', 'Đam mê mảng Thể thao và Văn hóa. Đưa tin SEA Games, Olympic và các sự kiện văn hóa lớn trong nước.', 'reporter', 'active', NULL, NULL, '2026-09-12 13:53:59'),
(6, 'reporter_3', 'reporter3@gmail.com', '$2y$10$9ECV/YTEO4/Nv0zgudylfODmxuwZKkeI50LiXbhu.hTeDq1zBYKdK', 'Trần Phóng Viên Ba', NULL, 'Phóng viên trẻ, chuyên về mảng Công nghệ và Đời sống số.', 'reporter', 'active', NULL, NULL, '2026-09-12 13:55:43'),
(7, 'docgia_1', 'docgia1@gmail.com', '$2y$10$NR2aJq0w7t8gelqGXVLfiuZIYBWeMgEDLG9yWSoIcK2FSZXIO1fyO', 'Hồ Độc Giả Một', 'backend/api/upload/avatars/avatar_6aa537e3d8e89_1789212643.webp', '', 'user', 'active', NULL, NULL, '2026-09-12 13:58:20'),
(8, 'docgia_2', 'docgia2@gmail.com', '$2y$10$BTqOVJ/SLMidtOnGblISf.ZpbtfULG9bWv89eg02nTUYX/xS17kiu', 'Hồ Độc Giả Hai', NULL, NULL, 'user', 'active', NULL, NULL, '2026-09-12 13:59:40'),
(9, 'docgia_3', 'docgia3@gmail.com', '$2y$10$9iJNK3uR7/v6GNUF8Vrhk.1hPZtzigrvPPsyNEmMgQYKVYBhU.VjG', 'Hồ Độc Giả Ba', NULL, 'Yêu thích đọc và cập nhập các tin tức mục Công nghệ và Kinh tế.', 'user', 'active', NULL, NULL, '2026-09-12 14:00:29');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `articles`
--
ALTER TABLE `articles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `author_id` (`author_id`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `category_id` (`category_id`);

--
-- Chỉ mục cho bảng `article_tags`
--
ALTER TABLE `article_tags`
  ADD PRIMARY KEY (`article_id`,`tag_id`),
  ADD KEY `tag_id` (`tag_id`);

--
-- Chỉ mục cho bảng `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `article_id` (`article_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`user_id`,`article_id`),
  ADD KEY `article_id` (`article_id`);

--
-- Chỉ mục cho bảng `site_settings`
--
ALTER TABLE `site_settings`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `articles`
--
ALTER TABLE `articles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT cho bảng `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT cho bảng `site_settings`
--
ALTER TABLE `site_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `tags`
--
ALTER TABLE `tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `articles`
--
ALTER TABLE `articles`
  ADD CONSTRAINT `articles_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `articles_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `articles_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Các ràng buộc cho bảng `article_tags`
--
ALTER TABLE `article_tags`
  ADD CONSTRAINT `article_tags_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `article_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

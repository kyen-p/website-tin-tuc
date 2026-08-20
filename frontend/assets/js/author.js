// AUTHOR PAGE
// Hiển thị thông tin tác giả và danh sách bài viết
const params = new URLSearchParams(window.location.search);
const authorId = Number(params.get("id"));
const authorPage = document.getElementById("author-page");
function getImagePath(path) {
    if (!path) {
        return "../assets/images/avatar-default.png";
    }
    if (path.startsWith("/assets/")) {
        return ".." + path;
    }
    return path;
}
// Tìm tác giả
const author = MOCK_DATA.users.find(
    user => user.id === authorId
);
// Nếu không tìm thấy tác giả-
if (!author) {

    authorPage.innerHTML = `
        <div class="author-not-found">
            <h2>Không tìm thấy tác giả</h2>
            <p>Tác giả không tồn tại hoặc đường dẫn không hợp lệ</p>
        </div>
    `;
} else {
    // Lấy các bài viết của tác giả
    const authorArticles = MOCK_DATA.articles.filter(
        article =>
            article.author_id === author.id &&
            article.status === "published"
    );
    // Hiển thị thông tin tác giả
    authorPage.innerHTML = `
        <!-- AUTHOR PROFILE -->

        <section class="author-profile">

            <!-- ẢNH ĐẠI DIỆN -->

            <div class="author-avatar">

                <img
                    src="${getImagePath(author.avatar)}"
                    alt="${author.full_name}"
                >
            </div>

            <!-- THÔNG TIN TÁC GIẢ -->

            <div class="author-info">

                <div class="author-eyebrow">
                    TÁC GIẢ
                </div>

                <h1 class="author-name">
                    ${author.full_name}
                </h1>

                <div class="author-username">
                    @${author.username}
                </div>

                <p class="author-bio">
                    ${author.bio || "Phóng viên của Mạch Tin"}
                </p>

                <div class="author-count">
                    <strong>${authorArticles.length}</strong>
                    bài viết đã đăng
                </div>
            </div>
        </section>
        <!--  DANH SÁCH BÀI VIẾT-->
        <section class="author-articles">
            <div class="author-articles-heading">
                <h2>
                    Bài viết của ${author.full_name}
                </h2>
                <span>
                    ${authorArticles.length} bài viết
                </span>
            </div>
            <div class="author-article-list">
                ${
                    authorArticles.length > 0

                    ? authorArticles.map(article => {

                        const category = MOCK_DATA.categories.find(
                            category =>
                                category.id === article.category_id
                        );

                        return `

                            <article class="author-article">

                                <img
                                    src="${getImagePath(article.cover_image)}"
                                    alt="${article.title}"
                                >

                                <div class="author-article-content">

                                    <span class="article-category">
                                        ${category ? category.name : ""}
                                    </span>

                                    <h3>
                                        ${article.title}
                                    </h3>

                                    <p>
                                        ${article.short_description}
                                    </p>
                                </div>
                            </article>
                        `;
                    }).join("")
                    : `
                        <div class="author-no-articles">
                            Tác giả chưa có bài viết nào
                        </div>
                    `
                }
            </div>
        </section>
    `;
}
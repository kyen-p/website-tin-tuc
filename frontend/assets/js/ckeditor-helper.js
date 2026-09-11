/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/ckeditor-helper.js
 * PHÂN HỆ: Tiện ích Dùng chung Toàn hệ thống (Shared Editor Helper)
 * MÔ TẢ: Cấu hình và khởi tạo trình soạn thảo WYSIWYG CKEditor 5 Super-build chuẩn:
 *        - Hỗ trợ đầy đủ bộ công cụ: Định dạng văn bản, căn lề (Alignment),
 *          chèn bảng biểu (Tables), trích dẫn (BlockQuote), nhúng video (MediaEmbed).
 *        - Tích hợp sẵn CustomServerUploadAdapter tải ảnh trực tiếp lên máy chủ
 *          thông qua API `backend/api/upload.php`.
 *        - Hỗ trợ căn chỉnh vị trí ảnh (inline, block, side) và chú thích ảnh (caption).
 * PHẠM VI SỬ DỤNG:
 *   - Phóng viên soạn và sửa bài: frontend/reporter/write-article.html
 *   - Quản trị viên sửa đè bài: frontend/admin/published-articles.html
 * PHỤ THUỘC:
 *   - CKEditor 5 Super-build (cdn.ckeditor.com)
 *   - frontend/assets/js/common.js (resolveApiUrl, resolveAssetPath, showToast)
 * ==============================================================================
 */

(function () {
  "use strict";

  /**
   * Adapter xử lý tải ảnh lên máy chủ cục bộ cho CKEditor 5
   */
  class CustomServerUploadAdapter {
    constructor(loader) {
      this.loader = loader;
    }

    upload() {
      return this.loader.file.then(async (file) => {
        const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedMimes.includes(file.type)) {
          const msg = "Chỉ hỗ trợ tải lên tệp ảnh định dạng JPG, JPEG, PNG hoặc WebP!";
          if (typeof showToast === "function") showToast(msg, "warning");
          throw new Error(msg);
        }

        if (file.size > 5 * 1024 * 1024) {
          const msg = "Dung lượng ảnh chèn vào bài viết không được vượt quá 5MB!";
          if (typeof showToast === "function") showToast(msg, "warning");
          throw new Error(msg);
        }

        const formData = new FormData();
        formData.append("image", file);
        formData.append("type", "article");

        const uploadUrl = typeof resolveApiUrl === "function" ? resolveApiUrl("upload.php") : "../../backend/api/upload.php";
        const response = await fetch(uploadUrl, {
          method: "POST",
          credentials: "include",
          body: formData
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Tải ảnh lên máy chủ thất bại!");
        }

        const imageUrl = result.data.url;
        const displayUrl = typeof resolveAssetPath === "function" ? resolveAssetPath(imageUrl) : imageUrl;

        return {
          default: displayUrl
        };
      });
    }

    abort() {}
  }

  /**
   * Plugin đăng ký adapter tải ảnh vào kho plugin FileRepository của CKEditor 5
   */
  function CustomUploadAdapterPlugin(editor) {
    if (editor.plugins.has("FileRepository")) {
      editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
        return new CustomServerUploadAdapter(loader);
      };
    }
  }

  /**
   * [HÀM DÙNG CHUNG TOÀN HỆ THỐNG] Khởi tạo CKEditor 5 chuẩn nhất quán cho cả Phóng viên và Admin
   * @param {string|HTMLElement} target - Bộ chọn CSS hoặc thẻ DOM element (ví dụ '#editor', '#editContent')
   * @param {object} customOptions - Các tùy chọn bổ sung hoặc ghi đè (ví dụ placeholder)
   * @returns {Promise<ClassicEditor|null>} Đối tượng instance của CKEditor 5
   */
  async function initArticleEditor(target, customOptions = {}) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) {
      console.warn("initArticleEditor: Không tìm thấy phần tử DOM đích:", target);
      return null;
    }

    const EditorConstructor = (window.CKEDITOR && window.CKEDITOR.ClassicEditor) || window.ClassicEditor;
    if (!EditorConstructor) {
      console.error("initArticleEditor: Thư viện CKEditor 5 chưa được tải vào trang.");
      return null;
    }

    const defaultConfig = {
      extraPlugins: [CustomUploadAdapterPlugin],
      mediaEmbed: {
        previewsInData: true
      },
      toolbar: [
        "heading", "|",
        "bold", "italic", "underline", "link", "|",
        "alignment", "|",
        "bulletedList", "numberedList", "|",
        "imageUpload", "mediaEmbed", "insertTable", "blockQuote", "horizontalLine", "|",
        "undo", "redo"
      ],
      alignment: {
        options: ["left", "center", "right", "justify"]
      },
      image: {
        toolbar: [
          "imageTextAlternative",
          "toggleImageCaption",
          "imageStyle:inline",
          "imageStyle:block",
          "imageStyle:side"
        ]
      },
      table: {
        contentToolbar: [
          "tableColumn",
          "tableRow",
          "mergeTableCells"
        ]
      },
      removePlugins: [
        "CKBox",
        "CKFinder",
        "EasyImage",
        "RealTimeCollaborativeComments",
        "RealTimeCollaborativeTrackChanges",
        "RealTimeCollaborativeRevisionHistory",
        "PresenceList",
        "Comments",
        "TrackChanges",
        "TrackChangesData",
        "RevisionHistory",
        "Pagination",
        "WProofreader",
        "MathType",
        "SlashCommand",
        "Template",
        "DocumentOutline",
        "FormatPainter",
        "TableOfContents",
        "PasteFromOfficeEnhanced"
      ],
      placeholder: customOptions.placeholder || "Soạn thảo nội dung bài viết tại đây (hỗ trợ chèn ảnh, nhúng video, kẻ bảng biểu)..."
    };

    const mergedConfig = Object.assign({}, defaultConfig, customOptions);
    if (customOptions.extraPlugins) {
      mergedConfig.extraPlugins = [...defaultConfig.extraPlugins, ...customOptions.extraPlugins];
    }

    try {
      const editorInstance = await EditorConstructor.create(el, mergedConfig);
      return editorInstance;
    } catch (error) {
      console.error("Lỗi khi khởi tạo CKEditor 5:", error);
      return null;
    }
  }

  // Xuất các hàm ra phạm vi toàn cục
  window.CustomServerUploadAdapter = CustomServerUploadAdapter;
  window.initArticleEditor = initArticleEditor;
})();

const MT = {
  ink: '#131B2E', paper: '#F5F3EE', paperAlt: '#ECE7DA',
  brass: '#B8894F', brassDark: '#93692F', crimson: '#A6362C',
  line: '#D9D3C2', muted: '#6B6759'
};

const formatDDMM = (date) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
};
const generateTimeLabels = () => {
  const today = new Date();
  const d7 = [], d30 = [], d90 = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(today.getDate() - i); d7.push(formatDDMM(d)); }
  for (let i = 3; i >= 0; i--) { const d = new Date(); d.setDate(today.getDate() - (i * 7)); d30.push(formatDDMM(d)); }
  for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(today.getDate() - (i * 15)); d90.push(formatDDMM(d)); }
  return { d7, d30, d90 };
};
const TIME_LABELS = generateTimeLabels();

const get = (key) => (typeof MOCK_DATA !== 'undefined' && Array.isArray(MOCK_DATA[key])) ? MOCK_DATA[key] : [];
const publishedArticles = () => get('articles').filter(a => a.status === 'published');
const catName = (id) => { const c = get('categories').find(x => x.id === id); return c ? c.name : ''; };
const tagName = (id) => { const t = get('tags').find(x => x.id === id); return t ? t.name : ''; };
const userName = (id) => { const u = get('users').find(x => x.id === id); return u ? u.full_name : ''; };

const computeUserBreakdown = () => {
  const users = get('users');
  const roles = [
    { key: 'user', label: 'User' },
    { key: 'reporter', label: 'Reporter' },
    { key: 'editor', label: 'Editor' },
    { key: 'admin', label: 'Admin' }
  ];
  return {
    total: users.length,
    rows: roles.map(r => ({ label: r.label, count: users.filter(u => u.role === r.key).length }))
  };
};

const computeArticleBreakdown = () => {
  const articles = get('articles');
  const published = articles.filter(a => a.status === 'published').length;
  const pending = articles.filter(a => a.status === 'pending').length;
  return {
    total: published, // thẻ chỉ tính "đã đăng", không tính chờ duyệt/từ chối
    rows: [
      { label: 'Đã đăng', count: published },
      { label: 'Chờ duyệt', count: pending }
    ]
  };
};

const computeCommentBreakdown = () => {
  const comments = get('comments');
  const pendingReports = get('comment_reports').filter(r => r.status === 'pending').length;
  return {
    total: comments.length,
    rows: [
      { label: 'Bình thường', count: comments.length - pendingReports },
      { label: 'Chờ xử lý báo cáo', count: pendingReports }
    ]
  };
};

const renderBreakdown = (elId, rows) => {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = rows.map(r => `<li>${r.label} <span>${r.count}</span></li>`).join('');
};

const renderStatCards = () => {
  const users = computeUserBreakdown();
  const articles = computeArticleBreakdown();
  const comments = computeCommentBreakdown();

  document.getElementById('stat-total-users').textContent = users.total;
  renderBreakdown('stat-users-breakdown', users.rows);

  document.getElementById('stat-published-articles').textContent = articles.total;
  renderBreakdown('stat-articles-breakdown', articles.rows);

  document.getElementById('stat-total-comments').textContent = comments.total;
  renderBreakdown('stat-comments-breakdown', comments.rows);

  document.getElementById('stat-total-views').textContent = formatViews(TOTAL_VIEWS);
};

const computeCategoryViews = () => {
  const sum = {};
  publishedArticles().forEach(a => { sum[a.category_id] = (sum[a.category_id] || 0) + (a.view_count || 0); });
  return Object.keys(sum).map(id => ({ name: catName(+id), total: sum[id] }))
    .filter(x => x.name).sort((a, b) => b.total - a.total);
};

const computeTagViews = () => {
  const arts = get('articles');
  const sum = {};
  get('article_tags').forEach(link => {
    const a = arts.find(x => x.id === link.article_id);
    if (a && a.status === 'published') sum[link.tag_id] = (sum[link.tag_id] || 0) + (a.view_count || 0);
  });
  return Object.keys(sum).map(id => ({ name: tagName(+id), total: sum[id] }))
    .filter(x => x.name).sort((a, b) => b.total - a.total).slice(0, 8);
};

const computeTopArticles = () => publishedArticles()
  .slice().sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5)
  .map(a => ({ id: a.id, title: a.title, cat: catName(a.category_id), author: userName(a.author_id), views: a.view_count || 0 }));

const computeTotalViews = () => publishedArticles().reduce((s, a) => s + (a.view_count || 0), 0);

const CATEGORY_BASE = computeCategoryViews();
const TAG_BASE = computeTagViews();
const TOP_ARTICLES_BASE = computeTopArticles();
const TOTAL_VIEWS = computeTotalViews();

const scaleArray = (arr, r) => arr.map(x => ({ name: x.name, total: Math.round(x.total * r) }));
const scaleArticles = (arr, r) => arr.map(x => ({ ...x, views: Math.round(x.views * r) }));

const DASH_DATA = {
  d7: {
    hint: 'Mỗi điểm = 1 ngày', labels: TIME_LABELS.d7,
    views: [64, 88, 102, 95, 128, 146, 37],
    categories: scaleArray(CATEGORY_BASE, 0.25),
    tags: scaleArray(TAG_BASE, 0.25),
    topArticles: scaleArticles(TOP_ARTICLES_BASE, 0.25)
  },
  d30: {
    hint: 'Mỗi điểm = 1 tuần', labels: TIME_LABELS.d30,
    views: [120, 140, 160, 660],
    categories: scaleArray(CATEGORY_BASE, 0.6),
    tags: scaleArray(TAG_BASE, 0.6),
    topArticles: scaleArticles(TOP_ARTICLES_BASE, 0.6)
  },
  d90: {
    hint: 'Mỗi điểm = 15 ngày', labels: TIME_LABELS.d90,
    views: [50, 70, 90, 110, 240, 660],
    categories: CATEGORY_BASE,
    tags: TAG_BASE,
    topArticles: TOP_ARTICLES_BASE
  }
};

const charts = {};
Chart.defaults.font.family = "'IBM Plex Mono', monospace";
Chart.defaults.font.size = 11;
Chart.defaults.color = MT.muted;

const tooltipStyle = {
  backgroundColor: MT.ink, titleColor: MT.paper, bodyColor: MT.paper,
  titleFont: { family: "'IBM Plex Mono', monospace", size: 11 },
  bodyFont: { family: "'IBM Plex Mono', monospace", size: 11 },
  cornerRadius: 0, padding: 10, displayColors: false
};

const createViewsChart = () => {
  const ctx = document.getElementById('chart-views-time');
  if (!ctx) return;
  charts.views = new Chart(ctx, {
    type: 'line',
    data: {
      labels: DASH_DATA.d7.labels,
      datasets: [{
        label: 'Lượt đọc', data: DASH_DATA.d7.views,
        borderColor: MT.brass, backgroundColor: 'rgba(184, 137, 79, .15)',
        fill: true, tension: .3, pointBackgroundColor: MT.ink, pointRadius: 3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: tooltipStyle },
      scales: { y: { beginAtZero: true, grid: { color: MT.line } }, x: { grid: { display: false } } }
    }
  });
};

const createCategoryChart = () => {
  const ctx = document.getElementById('chart-views-category');
  if (!ctx) return;
  const d = DASH_DATA.d90;
  charts.category = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.categories.map(c => c.name),
      datasets: [{
        label: 'Lượt xem', data: d.categories.map(c => c.total),
        backgroundColor: MT.brass, borderRadius: 2, borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: tooltipStyle },
      scales: { x: { beginAtZero: true, grid: { color: MT.line } }, y: { grid: { display: false } } }
    }
  });
};

const createTagChart = () => {
  const ctx = document.getElementById('chart-views-tag');
  if (!ctx) return;
  const d = DASH_DATA.d90;
  charts.tag = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.tags.map(t => '#' + t.name),
      datasets: [{
        label: 'Lượt xem', data: d.tags.map(t => t.total),
        backgroundColor: MT.brassDark, borderRadius: 2, borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: tooltipStyle },
      scales: { x: { beginAtZero: true, grid: { color: MT.line } }, y: { grid: { display: false } } }
    }
  });
};

const createUserStatusChart = () => {
  const ctx = document.getElementById('chart-user-status');
  if (!ctx) return;
  const users = get('users');
  const active = users.filter(u => u.status === 'active').length;
  const locked = users.filter(u => u.status === 'locked').length;
  charts.userStatus = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Hoạt động', 'Bị khóa'],
      datasets: [{ data: [active, locked], backgroundColor: [MT.brass, MT.crimson], borderWidth: 0, cutout: '65%' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15, font: { size: 11 } } }, tooltip: tooltipStyle }
    }
  });
};

const formatViews = (n) => n.toLocaleString('vi-VN');
const renderTopList = (range) => {
  const box = document.getElementById('top-articles-list');
  if (!box) return;
  box.innerHTML = DASH_DATA[range].topArticles.map((a, i) => `
    <a class="toplist__item" href="../public/article-detail.html?id=${a.id}">
      <span class="toplist__num">${String(i + 1).padStart(2, '0')}</span>
      <span class="toplist__main">
        <span class="toplist__title">${a.title}</span>
        <span class="toplist__meta">${a.cat} · ${a.author}</span>
      </span>
      <span class="toplist__views">${formatViews(a.views)}</span>
    </a>
  `).join('');
};

const updateCharts = (range) => {
  const d = DASH_DATA[range];
  if (!d) return;
  const hint = document.querySelector('#chart-views-time')?.closest('.chart-box')?.querySelector('.chart-box__hint');
  if (hint && d.hint) hint.textContent = d.hint;

  if (charts.views) { charts.views.data.labels = d.labels; charts.views.data.datasets[0].data = d.views; charts.views.update(); }
  if (charts.category) { charts.category.data.labels = d.categories.map(c => c.name); charts.category.data.datasets[0].data = d.categories.map(c => c.total); charts.category.update(); }
  if (charts.tag) { charts.tag.data.labels = d.tags.map(t => '#' + t.name); charts.tag.data.datasets[0].data = d.tags.map(t => t.total); charts.tag.update(); }
  renderTopList(range);
};

const initTabs = () => {
  const tabs = document.querySelectorAll('.charts-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      updateCharts(tab.dataset.range);
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  renderStatCards();   
  createViewsChart();
  createCategoryChart();
  createTagChart();
  createUserStatusChart();
  renderTopList('d7');
  initTabs();
});
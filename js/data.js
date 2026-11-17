/* ============================================
   data.js - Load & cache JSON data
   ============================================ */

const DataStore = {
  cache: {},

  async fetchJSON(path) {
    if (this.cache[path]) return this.cache[path];
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.cache[path] = data;
      return data;
    } catch (err) {
      console.error(`Gagal memuat ${path}:`, err);
      return null;
    }
  },

  async getLinks() {
    return await this.fetchJSON('data/links.json');
  },

  async getDpjps() {
    const data = await this.fetchJSON('data/dpjps.json');
    return data && data.dpjps ? data.dpjps : (Array.isArray(data) ? data : []);
  },

  async getTemplateUmum() {
    const data = await this.fetchJSON('data/dpjps.json');
    return data && data.templateUmum ? data.templateUmum : [];
  },

  async getSchedules() {
    return await this.fetchJSON('data/schedules.json');
  },

  async getInfoStase() {
    return await this.fetchJSON('data/info-stase.json');
  }
};

/* ============================================
   Render helpers
   ============================================ */

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function highlightMatch(text, query) {
  const safe = escapeHtml(text);
  if (!query) return safe;
  const safeQuery = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${safeQuery})`, 'gi');
  return safe.replace(re, '<mark>$1</mark>');
}

function initials(name) {
  if (!name) return '?';
  const cleaned = name.replace(/^(dr\.|Prof\.|dr)\.?\s*/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function avatarColor(seed) {
  const colors = ['#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6', '#EF4444'];
  let hash = 0;
  for (let i = 0; i < (seed || 'x').length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month} ${hours}:${mins}`;
}

/* ============================================
   Render: Link tab (gabungan SOP KONRU + Handover + Ruangan per Gedung)
   ============================================ */
function renderLink(links, query = '') {
  const container = document.getElementById('linkContent');
  if (!links) {
    container.innerHTML = '<p class="empty-state">Gagal memuat data links.</p>';
    return;
  }

  const q = (query || '').toLowerCase().trim();

  const filterItems = (items) => {
    if (!q) return items;
    return items.filter(item =>
      (item.judul || '').toLowerCase().includes(q) ||
      (item.keterangan || '').toLowerCase().includes(q) ||
      (item.nama || '').toLowerCase().includes(q)
    );
  };

  const linkCard = (item, type) => {
    if (item.locked && !item.url) {
      return `
        <div class="link-card link-locked" data-id="${escapeHtml(item.id)}">
          <div class="link-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div class="link-body">
            <p class="link-title">${escapeHtml(item.judul || item.nama || 'Tanpa nama')}</p>
            <p class="link-meta">Akses terkunci</p>
          </div>
        </div>
      `;
    }
    const isFav = Bookmark.isFavorite(type, item.id);
    const titleHtml = highlightMatch(item.judul || item.nama || '', q);
    const metaHtml = highlightMatch(item.keterangan || '', q);
    return `
      <a href="${escapeHtml(item.url || '#')}" target="_blank" rel="noopener noreferrer" class="link-card ${item.locked ? 'link-locked' : ''}" data-id="${escapeHtml(item.id)}">
        <div class="link-icon" aria-hidden="true">
          ${item.locked ? `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          ` : `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="9" y1="13" x2="15" y2="13"></line>
              <line x1="9" y1="17" x2="13" y2="17"></line>
            </svg>
          `}
        </div>
        <div class="link-body">
          <p class="link-title">${titleHtml}</p>
          ${metaHtml ? `<p class="link-meta">${metaHtml}</p>` : ''}
        </div>
        <button class="bookmark-btn ${isFav ? 'active' : ''}" data-bookmark-type="${type}" data-bookmark-id="${escapeHtml(item.id)}" aria-label="${isFav ? 'Hapus dari favorit' : 'Tambah ke favorit'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>
      </a>
    `;
  };

  let html = '';

  // 1. SOP KONRU (paling atas)
  if (links.konruDoc && links.konruDoc.length > 0) {
    const filteredKonru = filterItems(links.konruDoc);
    if (filteredKonru.length > 0) {
      html += `
        <div class="link-group">
          <h3 class="link-group-title">SOP KONRU</h3>
          <div class="link-list">
            ${filteredKonru.map(item => linkCard(item, 'konru')).join('')}
          </div>
        </div>
      `;
    }
  }

  // 2. Handover sheets
  if (links.handover && links.handover.length > 0) {
    const filteredHandover = filterItems(links.handover);
    if (filteredHandover.length > 0) {
      html += `
        <div class="link-group">
          <h3 class="link-group-title">Handover</h3>
          <div class="link-list">
            ${filteredHandover.map(item => linkCard(item, 'handover')).join('')}
          </div>
        </div>
      `;
    }
  }

  // 3. Gedung sections
  if (links.gedung && Array.isArray(links.gedung)) {
    links.gedung.forEach(gedung => {
      const filtered = filterItems(gedung.ruangan || []);
      if (filtered.length > 0) {
        html += `
          <div class="link-group">
            <h3 class="link-group-title">${escapeHtml(gedung.nama || 'Gedung')}</h3>
            <div class="link-list">
              ${filtered.map(item => linkCard(item, 'ruangan')).join('')}
            </div>
          </div>
        `;
      }
    });
  }

  if (!html) {
    container.innerHTML = `<div class="no-results"><strong>Tidak ada hasil</strong>Coba kata kunci lain.</div>`;
    return;
  }

  container.innerHTML = html;
}

/* ============================================
   Render: Template tab
   ============================================ */

const TEMPLATE_SCENARIOS = [
  { id: 'followup-krisan-mawar-teratai', label: 'FU Krisan, Mawar, Teratai' },
  { id: 'followup-amarilis-cvcu', label: 'FU Amarilis & CVCU' },
  { id: 'followup-edelweis-icu-hcu', label: 'FU Edelweis, ICU, HCU' },
  { id: 'followup-all', label: 'FU All Pasien DPJP' },
  { id: 'naik-jaga', label: 'Naik Jaga' },
  { id: 'turun-jaga', label: 'Turun Jaga' },
  { id: 'konsul', label: 'Konsul' }
];

let activeScenarioFilter = null;

function renderTemplateFilters(dpjps, query) {
  const container = document.getElementById('templateFilters');
  const usedScenarios = new Set();
  dpjps.forEach(dpjp => {
    (dpjp.templates || []).forEach(t => usedScenarios.add(t.scenario));
  });

  let html = `<button class="chip ${activeScenarioFilter === null ? 'active' : ''}" data-scenario="">Semua</button>`;
  TEMPLATE_SCENARIOS.forEach(s => {
    if (usedScenarios.has(s.id)) {
      html += `<button class="chip ${activeScenarioFilter === s.id ? 'active' : ''}" data-scenario="${s.id}">${s.label}</button>`;
    }
  });
  container.innerHTML = html;

  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeScenarioFilter = chip.dataset.scenario || null;
      DataStore.getDpjps().then(dpjps => {
        renderTemplateFilters(dpjps, query);
        renderTemplates(dpjps, query);
      });
    });
  });
}

function scenarioLabel(scenarioId) {
  const s = TEMPLATE_SCENARIOS.find(x => x.id === scenarioId);
  return s ? s.label : scenarioId;
}

function renderTemplates(dpjps, query = '') {
  const container = document.getElementById('dpjpList');
  if (!dpjps || dpjps.length === 0) {
    container.innerHTML = '<p class="empty-state">Belum ada DPJP. Tambahkan di <code>data/dpjps.json</code>.</p>';
    return;
  }

  const q = (query || '').toLowerCase().trim();

  let html = '';
  let totalShown = 0;

  dpjps.forEach(dpjp => {
    let templates = dpjp.templates || [];
    if (activeScenarioFilter) {
      templates = templates.filter(t => t.scenario === activeScenarioFilter);
    }
    if (q) {
      const dpjpMatch = (dpjp.nama || '').toLowerCase().includes(q) || (dpjp.spesialisasi || '').toLowerCase().includes(q);
      templates = templates.filter(t =>
      dpjpMatch ||
      (t.judul || '').toLowerCase().includes(q) ||
      (t.isi || '').toLowerCase().includes(q) ||
      scenarioLabel(t.scenario).toLowerCase().includes(q)
      );
    }

    if (templates.length === 0) return;
    totalShown += templates.length;

    const color = avatarColor(dpjp.nama || dpjp.id);
    const nameHtml = highlightMatch(dpjp.nama || '', q);
    const subHtml = highlightMatch(dpjp.spesialisasi || '', q);

    html += `
      <div class="dpjp-card" data-dpjp-id="${escapeHtml(dpjp.id)}">
        <div class="dpjp-header">
          <div class="dpjp-avatar" style="background:${color}">${escapeHtml(initials(dpjp.nama))}</div>
          <div class="dpjp-info">
            <p class="dpjp-name">${nameHtml}</p>
            ${subHtml ? `<p class="dpjp-sub">${subHtml}</p>` : ''}
            <div class="dpjp-meta">
              ${dpjp.wa ? `<span class="dpjp-meta-item">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-6.88 11.89L4 20l4.22-1.11a7.93 7.93 0 0 0 3.79.97h.04a7.94 7.94 0 0 0 7.94-7.94 7.86 7.86 0 0 0-2.39-5.6zm-5.55 12.21h-.03a6.6 6.6 0 0 1-3.36-.92l-.24-.14-2.5.66.67-2.44-.16-.25a6.59 6.59 0 0 1 5.62-10.07 6.55 6.55 0 0 1 4.66 1.93 6.55 6.55 0 0 1 1.93 4.67 6.6 6.6 0 0 1-6.59 6.56zm3.62-4.93c-.2-.1-1.17-.58-1.35-.64s-.31-.1-.45.1-.51.64-.63.78-.23.15-.43.05a7.86 7.86 0 0 1-2.32-1.43 8.7 8.7 0 0 1-1.61-2c-.17-.29 0-.45.13-.59s.29-.33.43-.5a.94.94 0 0 0 .14-.16.79.79 0 0 0 0-.75c0-.1-.45-1.07-.61-1.47s-.32-.33-.45-.34h-.39a.74.74 0 0 0-.54.25 2.25 2.25 0 0 0-.7 1.68 3.91 3.91 0 0 0 .82 2.07 9 9 0 0 0 3.43 3 11.7 11.7 0 0 0 1.14.42 2.74 2.74 0 0 0 1.26.08 2.06 2.06 0 0 0 1.35-.95 1.66 1.66 0 0 0 .12-.95c-.05-.09-.18-.14-.38-.24z"/></svg>
                <a href="https://wa.me/62${escapeHtml(dpjp.wa.replace(/^0/, ''))}" target="_blank" rel="noopener">${escapeHtml(dpjp.wa)}</a>
              </span>` : ''}
              ${dpjp.visite ? `<span class="dpjp-meta-item" title="Jam visite">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${escapeHtml(dpjp.visite.length > 30 ? dpjp.visite.slice(0, 28) + '...' : dpjp.visite)}
              </span>` : ''}
            </div>
          </div>
        </div>
        <div class="dpjp-templates">
          ${templates.map(t => renderTemplateItem(t, q, dpjp.id)).join('')}
        </div>
      </div>
    `;
  });

  // Set HTML first (DPJP cards)
  if (totalShown === 0) {
    container.innerHTML = '';
  } else {
    container.innerHTML = html;
  }

  // Attach copy handlers for DPJP templates
  container.querySelectorAll('.dpjp-card:not([data-dpjp-id="umum"]) .copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.templateId;
      const dpjpId = btn.dataset.dpjpId;
      const dpjp = dpjps.find(d => d.id === dpjpId);
      const tmpl = dpjp && dpjp.templates.find(t => t.id === id);
      if (tmpl) {
        copyTemplateText(btn, tmpl.isi);
      }
    });
  });

  // Attach expand handlers for DPJP templates
  container.querySelectorAll('.dpjp-card:not([data-dpjp-id="umum"]) .expand-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.templateId;
      const dpjpId = btn.dataset.dpjpId;
      const dpjp = dpjps.find(d => d.id === dpjpId);
      const tmpl = dpjp && dpjp.templates.find(t => t.id === id);
      if (tmpl) {
        openTemplateModal(dpjp, tmpl);
      }
    });
  });

  // (Bookmark handlers attached globally by attachBookmarkHandlers in app.js)

  // Add template umum (area-based, not tied to specific DPJP)
  DataStore.getTemplateUmum().then(templateUmum => {
    if (templateUmum && templateUmum.length > 0) {
      let umumTemplates = templateUmum;
      if (activeScenarioFilter) {
        umumTemplates = umumTemplates.filter(t => t.scenario === activeScenarioFilter);
      }
      if (q) {
        umumTemplates = umumTemplates.filter(t =>
          (t.judul || '').toLowerCase().includes(q) ||
          (t.isi || '').toLowerCase().includes(q) ||
          scenarioLabel(t.scenario).toLowerCase().includes(q)
        );
      }

      if (umumTemplates.length > 0) {
        const umumHtml = `
          <div class="dpjp-card" data-dpjp-id="umum">
            <div class="dpjp-header">
              <div class="dpjp-avatar" style="background:#64748B">UM</div>
              <div class="dpjp-info">
                <p class="dpjp-name">Template Umum</p>
                <p class="dpjp-sub">Template berdasarkan area - pakai sesuai ruang jaga</p>
              </div>
            </div>
            <div class="dpjp-templates">
              ${umumTemplates.map(t => renderTemplateItem(t, q, 'umum')).join('')}
            </div>
          </div>
        `;

        // Append to existing content
        if (totalShown === 0) {
          container.innerHTML = umumHtml;
        } else {
          container.insertAdjacentHTML('beforeend', umumHtml);
        }
        totalShown += umumTemplates.length;

        // Attach copy handlers for umum
        container.querySelectorAll('[data-dpjp-id="umum"] .copy-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.templateId;
            const tmpl = templateUmum.find(t => t.id === id);
            if (tmpl) copyTemplateText(btn, tmpl.isi);
          });
        });

        // Attach expand handlers for umum
        container.querySelectorAll('[data-dpjp-id="umum"] .expand-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.templateId;
            const tmpl = templateUmum.find(t => t.id === id);
            if (tmpl) openTemplateModal({nama: 'Template Umum'}, tmpl);
          });
        });

        // (Bookmark handlers attached globally by attachBookmarkHandlers in app.js)
      }
    }

    if (totalShown === 0) {
      container.innerHTML = `<div class="no-results"><strong>Tidak ada hasil</strong>Coba kata kunci lain atau ubah filter.</div>`;
    }
  });
}

function renderTemplateItem(t, query, dpjpId) {
  const isFav = Bookmark.isFavorite('template', t.id);
  const titleHtml = highlightMatch(t.judul || scenarioLabel(t.scenario), query);
  const previewText = t.isi || '';
  const hasMore = previewText.length > 200 || previewText.split('\n').length > 4;
  const previewSlice = hasMore ? previewText.slice(0, 200) + '...' : previewText;
  const previewHtml = highlightMatch(previewSlice, query);

  return `
    <div class="template-item">
      <div class="template-item-head">
        <p class="template-title">${titleHtml}</p>
        <span class="template-scenario">${escapeHtml(scenarioLabel(t.scenario))}</span>
      </div>
      <pre class="template-preview-text ${hasMore ? 'has-more' : ''}">${previewHtml}</pre>
      <div class="template-actions">
        <button class="copy-btn" data-template-id="${escapeHtml(t.id)}" data-dpjp-id="${escapeHtml(dpjpId || '')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Salin
        </button>
        ${hasMore ? `
          <button class="expand-btn" data-template-id="${escapeHtml(t.id)}" data-dpjp-id="${escapeHtml(dpjpId || '')}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h6v6"></path>
              <path d="M9 21H3v-6"></path>
              <path d="M21 3l-7 7"></path>
              <path d="M3 21l7-7"></path>
            </svg>
            Lihat
          </button>
        ` : ''}
        <button class="bookmark-btn ${isFav ? 'active' : ''}" data-bookmark-type="template" data-bookmark-id="${escapeHtml(t.id)}" aria-label="${isFav ? 'Hapus dari favorit' : 'Tambah ke favorit'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  `;
}

async function copyTemplateText(btn, text) {
  // Apply profil replacement: ganti [NAMA_KOAS] & [PANGGILAN] dengan data tersimpan
  const finalText = (typeof Profil !== 'undefined' && Profil.applyToTemplate)
    ? Profil.applyToTemplate(text)
    : text;

  // Cek apakah masih ada placeholder yang belum terisi
  const missingNama = /\[NAMA_KOAS\]/.test(finalText);
  const missingPanggilan = /\[PANGGILAN\]/.test(finalText);
  if (missingNama || missingPanggilan) {
    showToast('Isi Profil dulu (tab Profil)', 'error');
    // Switch to profil tab after small delay
    setTimeout(() => {
      if (typeof switchTab === 'function') switchTab('profil');
    }, 800);
    return;
  }

  try {
    await navigator.clipboard.writeText(finalText);
    btn.classList.add('copied');
    const original = btn.innerHTML;
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Tersalin
    `;
    showToast('Tersalin ke clipboard', 'success');
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = original;
    }, 1800);
  } catch (err) {
    // Fallback for older browsers / file:// protocol
    const ta = document.createElement('textarea');
    ta.value = finalText;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('Tersalin ke clipboard', 'success');
    } catch (e2) {
      showToast('Gagal menyalin, salin manual', 'error');
    }
    document.body.removeChild(ta);
  }
}

/* ============================================
   Render: Jadwal tab
   ============================================ */
let activeJadwalView = 'jaga';

function renderJadwal(schedules, view) {
  const container = document.getElementById('jadwalContent');
  if (!schedules || !schedules[view]) {
    container.innerHTML = `
      <div class="jadwal-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
        Belum ada gambar jadwal untuk kategori ini.<br>
        Tambahkan path gambar di <code>data/schedules.json</code>.
      </div>
    `;
    return;
  }

  const items = schedules[view];
  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = `
      <div class="jadwal-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
        Belum ada gambar untuk kategori ini.
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="jadwal-image-card">
      ${item.judul ? `<h3 class="jadwal-image-title">${escapeHtml(item.judul)}</h3>` : ''}
      ${item.keterangan ? `<p class="jadwal-image-meta">${escapeHtml(item.keterangan)}</p>` : ''}
      <div class="jadwal-image-wrap">
        <img src="${escapeHtml(item.path)}" alt="${escapeHtml(item.judul || 'Jadwal')}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'jadwal-placeholder\\'>Gambar tidak ditemukan: ${escapeHtml(item.path)}<br>Letakkan file di folder <code>assets/</code>.</div>'">
      </div>
    </div>
  `).join('');
}

/* ============================================
   Template modal (full view)
   ============================================ */
function openTemplateModal(dpjp, tmpl) {
  const modal = document.getElementById('templateModal');
  const titleEl = document.getElementById('templateModalTitle');
  const previewEl = document.getElementById('templatePreview');
  const copyBtn = document.getElementById('templateCopyBtn');

  titleEl.textContent = `${dpjp.nama} - ${tmpl.judul || scenarioLabel(tmpl.scenario)}`;
  previewEl.textContent = tmpl.isi || '';
  modal.hidden = false;

  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(tmpl.isi);
      showToast('Tersalin ke clipboard', 'success');
    } catch (err) {
      showToast('Gagal menyalin', 'error');
    }
  };
}

function closeTemplateModal() {
  document.getElementById('templateModal').hidden = true;
}

/* ============================================
   Render: Info Stase tab
   ============================================ */
function renderInfoStase(info) {
  const container = document.getElementById('infoContent');
  if (!info) {
    container.innerHTML = '<p class="empty-state">Gagal memuat info stase.</p>';
    return;
  }

  let html = '';

  // Kontak Penting
  if (info.kontakPenting && info.kontakPenting.length > 0) {
    html += `
      <div class="info-section">
        <div class="info-section-header">
          <div class="info-section-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </div>
          <h3 class="info-section-title">Kontak Penting</h3>
        </div>
        <div class="info-section-body">
          <div class="kontak-list">
            ${info.kontakPenting.map(k => {
              const color = avatarColor(k.nama);
              const waUrl = k.kontak ? `https://wa.me/62${k.kontak.replace(/^0/, '').replace(/\D/g, '')}` : null;
              return `
                <a href="${waUrl || '#'}" ${waUrl ? 'target="_blank" rel="noopener"' : ''} class="kontak-item">
                  <div class="kontak-avatar" style="background:${color}">${escapeHtml(initials(k.nama))}</div>
                  <div class="kontak-info">
                    <p class="kontak-name">${escapeHtml(k.nama)}</p>
                    <p class="kontak-role">${escapeHtml(k.peran)}</p>
                  </div>
                  ${waUrl ? `<span class="kontak-action">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-6.88 11.89L4 20l4.22-1.11a7.93 7.93 0 0 0 3.79.97h.04a7.94 7.94 0 0 0 7.94-7.94 7.86 7.86 0 0 0-2.39-5.6zm-5.55 12.21h-.03a6.6 6.6 0 0 1-3.36-.92l-.24-.14-2.5.66.67-2.44-.16-.25a6.59 6.59 0 0 1 5.62-10.07 6.55 6.55 0 0 1 4.66 1.93 6.55 6.55 0 0 1 1.93 4.67 6.6 6.6 0 0 1-6.59 6.56z"/></svg>
                    ${escapeHtml(k.kontak)}
                  </span>` : ''}
                </a>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Jadwal Stase & Jaga (grid 2)
  const jadwalStase = info.jadwalStase || [];
  const jadwalJaga = info.jadwalJaga || [];
  if (jadwalStase.length > 0 || jadwalJaga.length > 0) {
    html += `
      <div class="info-grid-2">
        ${jadwalStase.length > 0 ? `
          <div class="info-section">
            <div class="info-section-header">
              <div class="info-section-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <h3 class="info-section-title">Jadwal Stase</h3>
            </div>
            <div class="info-section-body">
              ${jadwalStase.map(j => `
                <div class="info-card">
                  <p class="info-card-title">${escapeHtml(j.judul)}</p>
                  <p class="info-card-value">${escapeHtml(j.isi)}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        ${jadwalJaga.length > 0 ? `
          <div class="info-section">
            <div class="info-section-header">
              <div class="info-section-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              </div>
              <h3 class="info-section-title">Jadwal Jaga</h3>
            </div>
            <div class="info-section-body">
              ${jadwalJaga.map(j => `
                <div class="info-card">
                  <p class="info-card-title">${escapeHtml(j.judul)}</p>
                  <p class="info-card-value">${escapeHtml(j.isi)}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Workflow Harian
  if (info.workflowHarian && info.workflowHarian.length > 0) {
    html += `
      <div class="info-section">
        <div class="info-section-header">
          <div class="info-section-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <h3 class="info-section-title">Workflow Harian</h3>
        </div>
        <div class="info-section-body">
          ${info.workflowHarian.map(w => `
            <div class="info-card">
              <p class="info-card-title">${escapeHtml(w.jam)}</p>
              <p class="info-card-value">${escapeHtml(w.aktivitas)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Aturan Penting
  if (info.aturanPenting && info.aturanPenting.length > 0) {
    html += `
      <div class="info-section">
        <div class="info-section-header">
          <div class="info-section-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <h3 class="info-section-title">Aturan Penting Stase</h3>
        </div>
        <div class="info-section-body">
          ${info.aturanPenting.map(a => `
            <div class="info-card">
              <p class="info-card-title">${escapeHtml(a.judul)}</p>
              <p class="info-card-value">${escapeHtml(a.isi)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Aturan Jaga
  if (info.aturanJaga && info.aturanJaga.length > 0) {
    html += `
      <div class="info-section">
        <div class="info-section-header">
          <div class="info-section-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          </div>
          <h3 class="info-section-title">Aturan Jaga</h3>
        </div>
        <div class="info-section-body">
          ${info.aturanJaga.map(a => `
            <div class="info-card">
              <p class="info-card-title">${escapeHtml(a.judul)}</p>
              <p class="info-card-value">${escapeHtml(a.isi)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Syarat Kelulusan
  if (info.syaratKelulusan && info.syaratKelulusan.length > 0) {
    html += `
      <div class="info-section">
        <div class="info-section-header">
          <div class="info-section-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h3 class="info-section-title">Syarat Kelulusan</h3>
        </div>
        <div class="info-section-body">
          ${info.syaratKelulusan.map(s => `
            <div class="info-card">
              <p class="info-card-title">${escapeHtml(s.judul)}</p>
              <p class="info-card-value">${escapeHtml(s.isi)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Referensi
  if (info.referensi && info.referensi.length > 0) {
    html += `
      <div class="info-section">
        <div class="info-section-header">
          <div class="info-section-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          </div>
          <h3 class="info-section-title">Referensi</h3>
        </div>
        <div class="info-section-body">
          <div class="info-grid-2">
            ${info.referensi.map(r => `
              <div class="info-card">
                <p class="info-card-title">${escapeHtml(r.judul)}</p>
                <p class="info-card-value">${escapeHtml(r.untuk)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html || '<p class="empty-state">Belum ada info stase.</p>';
}

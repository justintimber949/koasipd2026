/* ============================================
   app.js - Main app controller
   ============================================ */

let currentTab = 'favorit';
let currentQuery = '';

/* ============================================
   Toast
   ============================================ */
function showToast(message, type = 'default') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = '';
  if (type === 'success') {
    icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (type === 'error') {
    icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  }

  toast.innerHTML = `${icon}<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 220);
  }, 2200);
}

/* ============================================
   Tab switching
   ============================================ */
function switchTab(tabName) {
  currentTab = tabName;

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });

  // Update tab panels
  document.querySelectorAll('.tab-content').forEach(panel => {
    panel.hidden = panel.id !== `tab-${tabName}`;
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });

  // Re-render with current query
  renderActiveTab();
}

async function renderActiveTab() {
  // Jangan render apa pun kalau belum login
  if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
    return;
  }

  if (currentTab === 'favorit') {
    renderFavoritTab();
  } else if (currentTab === 'link') {
    const links = await DataStore.getLinks();
    renderLink(links, currentQuery);
  } else if (currentTab === 'template') {
    const dpjps = await DataStore.getDpjps();
    renderTemplateFilters(dpjps, currentQuery);
    renderTemplates(dpjps, currentQuery);
  } else if (currentTab === 'jadwal') {
    const schedules = await DataStore.getSchedules();
    renderJadwal(schedules, activeJadwalView);
  } else if (currentTab === 'info') {
    const info = await DataStore.getInfoStase();
    renderInfoStase(info);
  } else if (currentTab === 'catatan') {
    renderNotes();
  } else if (currentTab === 'profil') {
    renderProfil();
  }

  // Re-attach bookmark handlers for link cards
  attachBookmarkHandlers();
}

function attachBookmarkHandlers() {
  document.querySelectorAll('.bookmark-btn[data-bookmark-type]').forEach(btn => {
    if (btn.dataset.handlerAttached) return;
    btn.dataset.handlerAttached = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const type = btn.dataset.bookmarkType;
      const id = btn.dataset.bookmarkId;
      const isNowFav = Bookmark.toggle(type, id);
      btn.classList.toggle('active', isNowFav);
      btn.setAttribute('aria-label', isNowFav ? 'Hapus dari favorit' : 'Tambah ke favorit');
    });
  });
}

/* ============================================
   Search
   ============================================ */
function handleSearch(query) {
  currentQuery = query.trim();

  const clearBtn = document.getElementById('clearSearch');
  clearBtn.hidden = !currentQuery;

  // If user types in search while on a tab without searchable content, switch to template
  if (currentQuery && (currentTab === 'jadwal' || currentTab === 'catatan' || currentTab === 'info' || currentTab === 'favorit')) {
    switchTab('template');
    return;
  }

  renderActiveTab();
}

/* ============================================
   Init
   ============================================ */
function init() {
  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Search
  const searchInput = document.getElementById('globalSearch');
  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => handleSearch(e.target.value), 150);
  });

  document.getElementById('clearSearch').addEventListener('click', () => {
    searchInput.value = '';
    handleSearch('');
    searchInput.focus();
  });

  // Jadwal segmented control
  document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeJadwalView = btn.dataset.jadwal;
      renderActiveTab();
    });
  });

  // Bottom nav
  document.getElementById('bottomFavorit').addEventListener('click', openFavoritModal);
  document.getElementById('bottomCatatan').addEventListener('click', () => switchTab('catatan'));

  // Add note
  document.getElementById('addNoteBtn').addEventListener('click', () => openNoteModal());

  // Note modal
  document.getElementById('noteCancel').addEventListener('click', closeNoteModal);
  document.getElementById('noteForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('noteId').value;
    const title = document.getElementById('noteTitle').value;
    const body = document.getElementById('noteBody').value;
    if (!title.trim() || !body.trim()) return;
    if (id) {
      Notes.update(id, title, body);
      showToast('Catatan diperbarui', 'success');
    } else {
      Notes.add(title, body);
      showToast('Catatan ditambahkan', 'success');
    }
    closeNoteModal();
    renderNotes();
  });

  // Favorit modal
  document.getElementById('favoritClose').addEventListener('click', closeFavoritModal);

  // Template modal
  document.getElementById('templateClose').addEventListener('click', closeTemplateModal);

  // Modal overlay click-to-close
  ['noteModal', 'favoritModal', 'templateModal'].forEach(id => {
    const overlay = document.getElementById(id);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.hidden = true;
    });
  });

  // ESC to close any open modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      ['noteModal', 'favoritModal', 'templateModal'].forEach(id => {
        document.getElementById(id).hidden = true;
      });
    }
  });

  // Initial render
  renderActiveTab();
}

function openFavoritModal() {
  const modal = document.getElementById('favoritModal');
  modal.hidden = false;
  renderFavoritList();
}

function closeFavoritModal() {
  document.getElementById('favoritModal').hidden = true;
}

// Boot
document.addEventListener('DOMContentLoaded', init);

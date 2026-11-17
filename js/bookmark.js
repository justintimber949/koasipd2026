/* ============================================
   bookmark.js - LocalStorage favorites
   ============================================ */

const Bookmark = {
  KEY: 'koas-ipd:favorites',

  getAll() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Gagal baca bookmark:', e);
      return [];
    }
  },

  saveAll(items) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Gagal simpan bookmark:', e);
    }
  },

  isFavorite(type, id) {
    return this.getAll().some(b => b.type === type && b.id === id);
  },

  add(type, id) {
    const items = this.getAll();
    if (!items.some(b => b.type === type && b.id === id)) {
      items.push({ type, id, added: Date.now() });
      this.saveAll(items);
      showToast('Ditambahkan ke favorit', 'success');
    }
  },

  remove(type, id) {
    const items = this.getAll().filter(b => !(b.type === type && b.id === id));
    this.saveAll(items);
    showToast('Dihapus dari favorit', 'success');
  },

  toggle(type, id) {
    if (this.isFavorite(type, id)) {
      this.remove(type, id);
      return false;
    } else {
      this.add(type, id);
      return true;
    }
  },

  clear() {
    localStorage.removeItem(this.KEY);
  }
};

/* ============================================
   Render favorit modal
   ============================================ */
async function renderFavoritList() {
  const container = document.getElementById('favoritList');
  const favorites = Bookmark.getAll();

  if (favorites.length === 0) {
    container.innerHTML = '<p class="favorit-empty">Belum ada favorit. Klik ikon bintang pada link atau template untuk menyimpan.</p>';
    return;
  }

  const [links, dpjps] = await Promise.all([DataStore.getLinks(), DataStore.getDpjps()]);

  let html = '';

  favorites.forEach(fav => {
    if (fav.type === 'handover' && links && links.handover) {
      const item = links.handover.find(x => x.id === fav.id);
      if (item) {
        html += renderFavoritItem(item.judul, item.url, item.keterangan, 'Handover');
      }
    } else if (fav.type === 'konru' && links && links.konruDoc) {
      const item = links.konruDoc.find(x => x.id === fav.id);
      if (item) {
        html += renderFavoritItem(item.judul, item.url, item.keterangan, 'KONRU');
      }
    } else if (fav.type === 'ruangan' && links && links.gedung) {
      let found = null;
      for (const g of links.gedung) {
        found = (g.ruangan || []).find(x => x.id === fav.id);
        if (found) break;
      }
      if (found) {
        html += renderFavoritItem(found.judul || found.nama, found.url, found.keterangan, 'Ruangan');
      }
    } else if (fav.type === 'template' && dpjps) {
      let foundDpjp = null, foundTmpl = null;
      for (const d of dpjps) {
        const t = (d.templates || []).find(x => x.id === fav.id);
        if (t) { foundDpjp = d; foundTmpl = t; break; }
      }
      if (foundTmpl) {
        html += renderFavoritItem(
          `${foundDpjp.nama} - ${foundTmpl.judul || scenarioLabel(foundTmpl.scenario)}`,
          null,
          foundTmpl.isi ? foundTmpl.isi.slice(0, 60) + '...' : '',
          'Template'
        );
      }
    }
  });

  container.innerHTML = html || '<p class="favorit-empty">Favorit tidak ditemukan atau data telah berubah.</p>';

  // Attach copy buttons for template favorites
  container.querySelectorAll('.favorit-item[data-template-id]').forEach(el => {
    const copyBtn = el.querySelector('.favorit-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const templateId = el.dataset.templateId;
        for (const d of dpjps || []) {
          const t = (d.templates || []).find(x => x.id === templateId);
          if (t) {
            try {
              await navigator.clipboard.writeText(t.isi);
              showToast('Tersalin ke clipboard', 'success');
            } catch (err) {
              showToast('Gagal menyalin', 'error');
            }
            return;
          }
        }
      });
    }
  });
}

function renderFavoritItem(title, url, keterangan, type) {
  const isLink = !!url;
  return `
    <div class="favorit-item" ${isLink ? '' : 'data-template-id="placeholder"'}>
      ${isLink
        ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="flex:1;min-width:0;text-decoration:none;color:inherit;display:flex;align-items:center;gap:var(--space-md);">
            <div class="link-icon" style="width:32px;height:32px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </div>
            <div style="flex:1;min-width:0;">
              <p style="margin:0;font-weight:500;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(title)}</p>
              <p style="margin:0;font-size:12px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(type)}${keterangan ? ' - ' + escapeHtml(keterangan) : ''}</p>
            </div>
          </a>`
        : `<div style="flex:1;min-width:0;display:flex;align-items:center;gap:var(--space-md);">
            <div class="link-icon" style="width:32px;height:32px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </div>
            <div style="flex:1;min-width:0;">
              <p style="margin:0;font-weight:500;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(title)}</p>
              <p style="margin:0;font-size:12px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(type)}${keterangan ? ' - ' + escapeHtml(keterangan) : ''}</p>
            </div>
          </div>`
      }
    </div>
  `;
}

/* ============================================
   Render Favorit as tab content (not modal)
   ============================================ */
async function renderFavoritTab() {
  const container = document.getElementById('favoritTabList');
  const favorites = Bookmark.getAll();

  if (favorites.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p style="margin:0 0 var(--space-sm);">Belum ada favorit.</p>
        <p style="margin:0;font-size:13px;">Klik ikon bintang pada link atau template untuk menyimpan di sini.</p>
      </div>
    `;
    return;
  }

  const [links, dpjps] = await Promise.all([DataStore.getLinks(), DataStore.getDpjps()]);

  let html = '';

  favorites.forEach(fav => {
    if (fav.type === 'handover' && links && links.handover) {
      const item = links.handover.find(x => x.id === fav.id);
      if (item) {
        html += renderFavoritTabItem(item.judul, item.url, item.keterangan, 'Handover', 'link', fav);
      }
    } else if (fav.type === 'konru' && links && links.konruDoc) {
      const item = links.konruDoc.find(x => x.id === fav.id);
      if (item) {
        html += renderFavoritTabItem(item.judul, item.url, item.keterangan, 'KONRU', 'link', fav);
      }
    } else if (fav.type === 'ruangan' && links && links.gedung) {
      let found = null;
      for (const g of links.gedung) {
        found = (g.ruangan || []).find(x => x.id === fav.id);
        if (found) break;
      }
      if (found) {
        html += renderFavoritTabItem(found.judul || found.nama, found.url, found.keterangan, 'Ruangan', 'link', fav);
      }
    } else if (fav.type === 'template' && dpjps) {
      let foundDpjp = null, foundTmpl = null;
      for (const d of dpjps) {
        const t = (d.templates || []).find(x => x.id === fav.id);
        if (t) { foundDpjp = d; foundTmpl = t; break; }
      }
      if (foundTmpl) {
        html += renderFavoritTabItem(
          `${foundDpjp.nama} - ${foundTmpl.judul || scenarioLabel(foundTmpl.scenario)}`,
          null,
          foundTmpl.isi ? foundTmpl.isi.slice(0, 80).replace(/\n/g, ' ') + '...' : '',
          'Template',
          'template',
          fav,
          foundTmpl.isi
        );
      }
    }
  });

  if (!html) {
    container.innerHTML = '<p class="empty-state">Favorit tidak ditemukan atau data telah berubah.</p>';
    return;
  }

  container.innerHTML = html;

  // Attach handlers - works for both <a> and <div> containers
  container.querySelectorAll('.favorit-tab-item').forEach(el => {
    const templateId = el.dataset.templateId;
    const favType = el.dataset.favType;
    const favId = el.dataset.favId;

    // Copy button (template only)
    const copyBtn = el.querySelector('.favorit-tab-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Find template in dpjps or templateUmum
        let foundText = null;
        for (const d of dpjps || []) {
          const t = (d.templates || []).find(x => x.id === templateId);
          if (t) { foundText = t.isi; break; }
        }
        // Also check templateUmum
        if (!foundText) {
          const umum = await DataStore.getTemplateUmum();
          if (umum) {
            const t = umum.find(x => x.id === templateId);
            if (t) foundText = t.isi;
          }
        }
        if (foundText) {
          // Apply profil replacement + validation (same as copyTemplateText)
          const finalText = (typeof Profil !== 'undefined' && Profil.applyToTemplate)
            ? Profil.applyToTemplate(foundText)
            : foundText;

          const missingNama = /\[NAMA_KOAS\]/.test(finalText);
          const missingPanggilan = /\[PANGGILAN\]/.test(finalText);
          if (missingNama || missingPanggilan) {
            showToast('Isi Profil dulu (tab Profil)', 'error');
            setTimeout(() => {
              if (typeof switchTab === 'function') switchTab('profil');
            }, 800);
            return;
          }

          try {
            await navigator.clipboard.writeText(finalText);
            showToast('Tersalin ke clipboard', 'success');
            copyBtn.classList.add('copied');
            const orig = copyBtn.innerHTML;
            copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            setTimeout(() => {
              copyBtn.classList.remove('copied');
              copyBtn.innerHTML = orig;
            }, 1500);
          } catch (err) {
            // Fallback for older browsers
            const ta = document.createElement('textarea');
            ta.value = finalText;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); showToast('Tersalin ke clipboard', 'success'); }
            catch (e2) { showToast('Gagal menyalin', 'error'); }
            document.body.removeChild(ta);
          }
        } else {
          showToast('Template tidak ditemukan', 'error');
        }
      });
    }

    // Remove button (all items)
    const removeBtn = el.querySelector('.favorit-tab-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        Bookmark.remove(favType, favId);
        renderFavoritTab();
      });
    }
  });
}

function renderFavoritTabItem(title, url, keterangan, type, kind, fav, templateText) {
  const isLink = !!url && kind === 'link';
  const linkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>`;
  const templateIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>`;
  const removeIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>`;
  const copyIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>`;

  const tag = isLink ? 'a' : 'div';
  const linkAttrs = isLink
    ? `href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"`
    : '';
  const templateAttr = kind === 'template' ? `data-template-id="${escapeHtml(fav.id)}"` : '';

  return `
    <${tag} class="favorit-tab-item" data-fav-type="${escapeHtml(fav.type)}" data-fav-id="${escapeHtml(fav.id)}" ${templateAttr} ${linkAttrs}>
      <div class="favorit-tab-icon" aria-hidden="true">${isLink ? linkIcon : templateIcon}</div>
      <div class="favorit-tab-body">
        <p class="favorit-tab-title">${escapeHtml(title)}</p>
        <p class="favorit-tab-meta">${escapeHtml(type)}${keterangan ? ' - ' + escapeHtml(keterangan) : ''}</p>
      </div>
      ${kind === 'template' ? `
        <button class="favorit-tab-action favorit-tab-copy" aria-label="Salin template" title="Salin">
          ${copyIcon}
        </button>
      ` : ''}
      <button class="favorit-tab-action favorit-tab-remove" aria-label="Hapus dari favorit" title="Hapus dari favorit">
        ${removeIcon}
      </button>
    </${tag}>
  `;
}

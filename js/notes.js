/* ============================================
   notes.js - LocalStorage catatan
   ============================================ */

const Notes = {
  KEY: 'koas-ipd:notes',

  getAll() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Gagal baca notes:', e);
      return [];
    }
  },

  saveAll(items) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Gagal simpan notes:', e);
    }
  },

  add(title, body) {
    const items = this.getAll();
    const note = {
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title: title.trim(),
      body: body.trim(),
      created: Date.now(),
      updated: Date.now()
    };
    items.unshift(note);
    this.saveAll(items);
    return note;
  },

  update(id, title, body) {
    const items = this.getAll();
    const note = items.find(n => n.id === id);
    if (note) {
      note.title = title.trim();
      note.body = body.trim();
      note.updated = Date.now();
      this.saveAll(items);
    }
    return note;
  },

  delete(id) {
    const items = this.getAll().filter(n => n.id !== id);
    this.saveAll(items);
  },

  exportAll() {
    const items = this.getAll();
    return JSON.stringify(items, null, 2);
  }
};

/* ============================================
   Render notes
   ============================================ */
function renderNotes() {
  const container = document.getElementById('notesList');
  const notes = Notes.getAll();

  if (notes.length === 0) {
    container.innerHTML = '<p class="empty-state">Belum ada catatan. Klik "Tambah Catatan" untuk membuat.</p>';
    return;
  }

  container.innerHTML = notes.map(note => `
    <div class="note-card" data-note-id="${escapeHtml(note.id)}">
      <div class="note-head">
        <p class="note-title">${escapeHtml(note.title)}</p>
        <span class="note-date">${escapeHtml(formatDate(note.updated || note.created))}</span>
      </div>
      <p class="note-body">${escapeHtml(note.body)}</p>
      <div class="note-actions">
        <button class="note-action" data-action="edit">Edit</button>
        <button class="note-action danger" data-action="delete">Hapus</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.note-card').forEach(card => {
    const id = card.dataset.noteId;
    card.querySelector('[data-action="edit"]').addEventListener('click', () => {
      const note = Notes.getAll().find(n => n.id === id);
      if (note) openNoteModal(note);
    });
    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (confirm('Hapus catatan ini?')) {
        Notes.delete(id);
        renderNotes();
        showToast('Catatan dihapus', 'success');
      }
    });
  });
}

/* ============================================
   Note modal
   ============================================ */
function openNoteModal(note = null) {
  const modal = document.getElementById('noteModal');
  const titleEl = document.getElementById('noteModalTitle');
  const idEl = document.getElementById('noteId');
  const titleInput = document.getElementById('noteTitle');
  const bodyInput = document.getElementById('noteBody');

  if (note) {
    titleEl.textContent = 'Edit Catatan';
    idEl.value = note.id;
    titleInput.value = note.title;
    bodyInput.value = note.body;
  } else {
    titleEl.textContent = 'Tambah Catatan';
    idEl.value = '';
    titleInput.value = '';
    bodyInput.value = '';
  }

  modal.hidden = false;
  setTimeout(() => titleInput.focus(), 50);
}

function closeNoteModal() {
  document.getElementById('noteModal').hidden = true;
}

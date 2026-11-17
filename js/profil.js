/* ============================================
   profil.js - Simpan nama & panggilan koas
   ============================================
   Data tersimpan di localStorage. Saat user copy
   template, [NAMA_KOAS] & [PANGGILAN] akan otomatis
   diganti dengan nilai dari sini.
   ============================================ */

const Profil = {
  KEY: 'koas-ipd:profil',

  get() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : { nama: '', panggilan: '' };
    } catch (e) {
      return { nama: '', panggilan: '' };
    }
  },

  save(nama, panggilan) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify({
        nama: nama.trim(),
        panggilan: panggilan.trim()
      }));
      return true;
    } catch (e) {
      console.error('Gagal simpan profil:', e);
      return false;
    }
  },

  clear() {
    localStorage.removeItem(this.KEY);
  },

  /**
   * Replace placeholder [NAMA_KOAS] dan [PANGGILAN] di teks template
   * dengan nilai dari profil tersimpan. Kalau profil kosong, biarkan
   * placeholder agar user tahu perlu diisi.
   */
  applyToTemplate(text) {
    const profil = this.get();
    let result = text;
    if (profil.nama) {
      result = result.replace(/\[NAMA_KOAS\]/g, profil.nama);
    }
    if (profil.panggilan) {
      result = result.replace(/\[PANGGILAN\]/g, profil.panggilan);
    }
    return result;
  }
};

/* ============================================
   UI: Render profil di tab Profil
   ============================================ */
function renderProfil() {
  const profil = Profil.get();
  const namaInput = document.getElementById('profilNama');
  const panggilanInput = document.getElementById('profilPanggilan');
  const infoDiv = document.getElementById('profilInfo');
  const infoNama = document.getElementById('profilInfoNama');
  const infoPanggilan = document.getElementById('profilInfoPanggilan');

  if (namaInput) namaInput.value = profil.nama || '';
  if (panggilanInput) panggilanInput.value = profil.panggilan || '';

  if (infoDiv && infoNama && infoPanggilan) {
    if (profil.nama || profil.panggilan) {
      infoDiv.hidden = false;
      infoNama.textContent = profil.nama || '—';
      infoPanggilan.textContent = profil.panggilan || '—';
    } else {
      infoDiv.hidden = true;
    }
  }
}

function initProfilHandlers() {
  const form = document.getElementById('profilForm');
  const clearBtn = document.getElementById('profilClear');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nama = document.getElementById('profilNama').value;
      const panggilan = document.getElementById('profilPanggilan').value;
      if (Profil.save(nama, panggilan)) {
        showToast('Profil tersimpan', 'success');
        renderProfil();
      } else {
        showToast('Gagal menyimpan profil', 'error');
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Hapus data profil? Template akan kembali pakai [NAMA_KOAS] dan [PANGGILAN].')) {
        Profil.clear();
        renderProfil();
        showToast('Profil dihapus', 'success');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initProfilHandlers);

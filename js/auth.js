/* ============================================
   auth.js - Simple password gate
   ============================================
   Cara kerja:
   - Saat website dibuka, cek sessionStorage untuk token auth
   - Kalau tidak ada (belum login), tampilkan overlay password
   - Kalau password benar, simpan token ke sessionStorage (hapus saat tab ditutup)
   - Setelah login di satu tab, tab baru di browser yang sama tidak perlu login lagi (sessionStorage shared per tab, tapi karena biasanya user pakai satu tab untuk development, ini OK)
   - Untuk persistent login (tidak perlu login lagi walau tutup browser), ganti sessionStorage ke localStorage
   ============================================ */

const Auth = {
  // GANTI PASSWORD DI SINI - default: koas-ipd-2026
  PASSWORD: 'koas-ipd-2026',

  // Key untuk simpan token auth di storage
  STORAGE_KEY: 'koas-ipd:auth',

  // 'sessionStorage' = hilang saat tab ditutup (lebih aman)
  // 'localStorage' = persistent walau browser ditutup (lebih praktis)
  STORAGE_TYPE: 'sessionStorage',

  isAuthenticated() {
    try {
      const stored = window[this.STORAGE_TYPE].getItem(this.STORAGE_KEY);
      return stored === 'ok';
    } catch (e) {
      return false;
    }
  },

  login(password) {
    if (password === this.PASSWORD) {
      try {
        window[this.STORAGE_TYPE].setItem(this.STORAGE_KEY, 'ok');
      } catch (e) {
        console.error('Gagal simpan auth:', e);
      }
      return true;
    }
    return false;
  },

  logout() {
    try {
      window[this.STORAGE_TYPE].removeItem(this.STORAGE_KEY);
    } catch (e) {}
  },

  showGate() {
    const overlay = document.getElementById('authOverlay');
    if (!overlay) return;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    // Focus ke input
    setTimeout(() => {
      const input = document.getElementById('authPassword');
      if (input) input.focus();
    }, 100);
  },

  hideGate() {
    const overlay = document.getElementById('authOverlay');
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = '';
  },

  init() {
    // Cek apakah sudah login
    if (this.isAuthenticated()) {
      this.hideGate();
      return;
    }

    // Tampilkan gate
    this.showGate();

    // Handle form submit
    const form = document.getElementById('authForm');
    const input = document.getElementById('authPassword');
    const error = document.getElementById('authError');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = input.value;
        if (this.login(value)) {
          this.hideGate();
          // Trigger render ulang tab aktif supaya konten muncul
          if (typeof renderActiveTab === 'function') {
            renderActiveTab();
          }
        } else {
          error.hidden = false;
          input.value = '';
          input.focus();
          // Shake animation
          input.style.animation = 'none';
          setTimeout(() => { input.style.animation = 'shake 0.4s'; }, 10);
        }
      });
    }

    // Auto-clear error saat user ngetik lagi
    if (input) {
      input.addEventListener('input', () => {
        error.hidden = true;
      });
    }
  }
};

// Auto-init saat DOM siap
document.addEventListener('DOMContentLoaded', () => Auth.init());

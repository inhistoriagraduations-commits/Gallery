/**
 * Inhistoria Photography - Common Utilities & Helpers
 */

const AppUtil = {
  // Key penyimpanan daftar project di browser fotografer
  STORAGE_PROJECTS: 'inhistoria_admin_projects',

  /**
   * Tampilkan Toast Notification elegan
   * @param {string} message Pesan
   * @param {'success'|'warning'|'error'|'info'} type Jenis notifikasi
   * @param {number} duration Durasi dalam ms
   */
  showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full px-4 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-2xl border text-sm font-medium transition-all duration-300 transform translate-y-[-10px] opacity-0';

    let icon = '';
    let bgBorder = '';

    switch (type) {
      case 'success':
        bgBorder = 'bg-[#12231c] text-emerald-300 border-emerald-500/40';
        icon = '<svg class="w-5 h-5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        break;
      case 'warning':
        bgBorder = 'bg-[#291f11] text-amber-300 border-amber-500/40';
        icon = '<svg class="w-5 h-5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
        break;
      case 'error':
        bgBorder = 'bg-[#2b1418] text-rose-300 border-rose-500/40';
        icon = '<svg class="w-5 h-5 flex-shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
        break;
      default:
        bgBorder = 'bg-[#171b24] text-sky-200 border-sky-500/30';
        icon = '<svg class="w-5 h-5 flex-shrink-0 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    }

    toast.className += ` ${bgBorder}`;
    toast.innerHTML = `
      ${icon}
      <div class="flex-1 text-xs leading-relaxed">${message}</div>
    `;

    container.appendChild(toast);

    // Animasi muncul
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-[-10px]', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Hilang otomatis
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-[-10px]', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Salin teks ke Clipboard
   */
  async copyToClipboard(text, successMessage = 'Teks berhasil disalin!') {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      this.showToast(successMessage, 'success');
      return true;
    } catch (err) {
      console.error('Gagal menyalin:', err);
      this.showToast('Gagal menyalin ke clipboard', 'error');
      return false;
    }
  },

  /**
   * Encode objek project menjadi parameter URL yang aman
   */
  encodeProject(project) {
    const jsonStr = JSON.stringify(project);
    return btoa(encodeURIComponent(jsonStr));
  },

  /**
   * Decode parameter URL menjadi objek project
   */
  decodeProject(hashOrParam) {
    try {
      const decodedStr = decodeURIComponent(atob(hashOrParam));
      return JSON.parse(decodedStr);
    } catch (e) {
      console.error('Gagal decode project:', e);
      return null;
    }
  },

  /**
   * Format nomor WhatsApp Indonesia (misal: 08123... -> 628123...)
   */
  formatWhatsAppNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '628' + cleaned.slice(1);
    }
    return cleaned;
  },

  /**
   * Susun format pesan WhatsApp untuk dikirim client ke fotografer
   */
  buildWhatsAppMessage({ clientName, selectedCodes, limit, photographerPhone }) {
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const numberedList = selectedCodes
      .map((code, idx) => `${idx + 1}. ${code}`)
      .join('\n');

    // Buat daftar nama file tanpa ekstensi untuk kemudahan filter Lightroom
    const lightroomQuery = selectedCodes
      .map(code => code.replace(/\.[^/.]+$/, ''))
      .join(', ');

    const message = 
`Halo *Inhistoria Photography*! 📸
Saya sudah selesai memilih foto untuk project:

*Nama Klien:* ${clientName}
*Jumlah Dipilih:* ${selectedCodes.length} dari batas ${limit} foto
*Tanggal:* ${dateStr}

*📋 DAFTAR KODE FOTO TERPILIH:*
${numberedList}

*🔍 FORMAT LIGHTROOM (Pencarian Cepat):*
\`${lightroomQuery}\`

Mohon untuk diproses ke tahap editing ya Kak. Terima kasih banyak! ✨`;

    const cleanPhone = this.formatWhatsAppNumber(photographerPhone);
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    return { message, waUrl, lightroomQuery };
  },

  /**
   * Download daftar foto sebagai file .TXT
   */
  downloadTxtFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('File TXT berhasil diunduh!', 'success');
  },

  /**
   * Kelola Daftar Project di LocalStorage Fotografer
   */
  getSavedProjects() {
    try {
      const data = localStorage.getItem(this.STORAGE_PROJECTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveProject(project) {
    const projects = this.getSavedProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.unshift(project);
    }
    localStorage.setItem(this.STORAGE_PROJECTS, JSON.stringify(projects));
  },

  deleteProject(projectId) {
    let projects = this.getSavedProjects();
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem(this.STORAGE_PROJECTS, JSON.stringify(projects));
  }
};

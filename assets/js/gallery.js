/**
 * Inhistoria Photography - Client Gallery Logic
 * Mengatur interaksi pemilihan foto oleh klien, Lightbox preview, autosave, dan pengiriman ke WhatsApp
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
  GalleryApp.init();
});

const GalleryApp = {
  project: null,
  allPhotos: [],
  selectedPhotos: new Map(), // Map<id, photoObj>
  currentLightboxIndex: -1,
  activeFilter: 'all', // 'all' | 'selected'
  searchQuery: '',

  /**
   * Inisialisasi Aplikasi Gallery
   */
  async init() {
    this.initElements();
    this.initKeyboardAndTouch();

    // Ambil parameter project dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const pParam = urlParams.get('p') || window.location.hash.replace('#p=', '');

    if (!pParam) {
      this.showErrorScreen('Link gallery tidak lengkap atau tidak valid. Silakan hubungi fotografer untuk mendapatkan link yang benar.');
      return;
    }

    const projectData = AppUtil.decodeProject(pParam);
    if (!projectData || !projectData.client) {
      this.showErrorScreen('Data project tidak dapat dibaca. Pastikan link gallery tidak terpotong.');
      return;
    }

    this.project = projectData;
    this.renderHeaderInfo();
    this.loadSavedSelections();

    // Muat foto dari Google Drive atau Mode Demo
    await this.loadPhotos();
  },

  initElements() {
    this.gridContainer = document.getElementById('photo-grid');
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.counterText = document.getElementById('counter-text');
    this.progressBar = document.getElementById('selection-progress');
    this.floatingBar = document.getElementById('floating-bar');
    this.searchInput = document.getElementById('search-photos');
    this.lightboxModal = document.getElementById('lightbox-modal');
    this.lightboxImg = document.getElementById('lightbox-img');
    this.lightboxTitle = document.getElementById('lightbox-title');
    this.lightboxIndex = document.getElementById('lightbox-index');
    this.lightboxSelectBtn = document.getElementById('lightbox-select-btn');
    this.reviewModal = document.getElementById('review-modal');

    // Event listener search filter
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderGallery();
      });
    }
  },

  /**
   * Tampilkan info client dan batas foto pada header
   */
  renderHeaderInfo() {
    const clientNameEl = document.getElementById('client-name-display');
    const limitBannerEl = document.getElementById('limit-banner-display');
    const notesEl = document.getElementById('client-notes-display');

    if (clientNameEl) clientNameEl.textContent = this.project.client;
    if (limitBannerEl) limitBannerEl.textContent = `Batas Pilih: ${this.project.limit} Foto`;

    if (notesEl && this.project.notes) {
      notesEl.textContent = `“${this.project.notes}”`;
      notesEl.classList.remove('hidden');
    }
  },

  /**
   * Muat daftar foto dari Google Drive atau Demo
   */
  async loadPhotos() {
    this.loadingIndicator.classList.remove('hidden');
    this.gridContainer.innerHTML = '';

    try {
      if (this.project.isDemo || this.project.folderId === 'demo') {
        this.allPhotos = DriveService.getDemoPhotos(this.project.client);
      } else {
        const apiKey = this.project.apiKey || DriveService.getStoredApiKey();
        this.allPhotos = await DriveService.fetchFolderPhotos(this.project.folderId, apiKey);
      }

      this.loadingIndicator.classList.add('hidden');

      if (this.allPhotos.length === 0) {
        this.showErrorScreen('Tidak ada file foto yang ditemukan di dalam folder Google Drive ini. Pastikan folder berisi foto berformat JPG/PNG.');
        return;
      }

      // Update total foto di tab filter
      const tabAllCount = document.getElementById('tab-all-count');
      if (tabAllCount) tabAllCount.textContent = this.allPhotos.length;

      this.renderGallery();
      this.updateSelectionUI();
    } catch (err) {
      console.error('Error loading photos:', err);
      this.loadingIndicator.classList.add('hidden');
      this.showErrorScreen(err.message || 'Gagal memuat foto dari Google Drive.');
    }
  },

  /**
   * Render Grid Foto
   */
  renderGallery() {
    if (!this.gridContainer) return;

    // Filter foto sesuai tab dan search query
    let filtered = this.allPhotos.filter(photo => {
      const matchSearch = !this.searchQuery || photo.name.toLowerCase().includes(this.searchQuery);
      if (this.activeFilter === 'selected') {
        return matchSearch && this.selectedPhotos.has(photo.id);
      }
      return matchSearch;
    });

    if (filtered.length === 0) {
      this.gridContainer.innerHTML = `
        <div class="col-span-full py-20 text-center text-neutral-400">
          <i data-lucide="image-off" class="w-12 h-12 mx-auto mb-3 text-neutral-600"></i>
          <p class="text-sm font-medium">Tidak ada foto yang sesuai dengan pencarian atau filter.</p>
          ${this.activeFilter === 'selected' ? '<p class="text-xs text-neutral-500 mt-1">Kamu belum memilih foto apa pun.</p>' : ''}
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    this.gridContainer.innerHTML = filtered.map(photo => {
      const isSelected = this.selectedPhotos.has(photo.id);
      return `
        <div class="photo-card group cursor-pointer ${isSelected ? 'is-selected' : ''}" 
             id="card-${photo.id}" 
             onclick="GalleryApp.handleCardClick(event, '${photo.id}')">
          
          <div class="aspect-[3/4] sm:aspect-square w-full relative bg-neutral-900 overflow-hidden">
            <img src="${photo.thumbUrl}" 
                 alt="${photo.name}" 
                 loading="lazy" 
                 onerror="this.onerror=null; this.src='${photo.fallbackUrl || photo.thumbUrl}';"
                 class="w-full h-full object-cover select-none pointer-events-none" />
            
            <!-- Checkbox Select Button (Pojok Kanan Atas) -->
            <button onclick="GalleryApp.toggleSelect(event, '${photo.id}')" 
                    title="${isSelected ? 'Batalkan Pilihan' : 'Pilih Foto'}"
                    class="select-badge absolute top-2.5 right-2.5 w-8 h-8 rounded-full border flex items-center justify-center transition-all z-10 shadow-lg ${isSelected ? 'bg-emerald-500 text-white border-emerald-500 scale-105' : 'bg-black/60 backdrop-blur-md text-white/70 border-white/30 hover:border-white hover:text-white'}">
              <i data-lucide="${isSelected ? 'check' : 'plus'}" class="w-4 h-4"></i>
            </button>

            <!-- Gradient Overlay di Bawah Foto -->
            <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>

            <!-- Kode / Nama File Foto -->
            <div class="absolute bottom-2 inset-x-2 flex items-center justify-between text-[11px] font-mono text-white/90 pointer-events-none">
              <span class="truncate bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 font-medium">
                ${photo.name}
              </span>
              <span class="text-[10px] text-white/50 bg-black/40 px-1.5 py-0.5 rounded">
                Preview
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  /**
   * Klik Card Foto -> Buka Lightbox untuk Review
   */
  handleCardClick(event, photoId) {
    // Jika user mengklik tombol plus/check secara spesifik, jangan buka lightbox
    if (event.target.closest('.select-badge')) return;
    this.openLightbox(photoId);
  },

  /**
   * Toggle Pilih / Batal Pilih Foto
   */
  toggleSelect(event, photoId) {
    if (event) {
      event.stopPropagation();
    }

    const photo = this.allPhotos.find(p => p.id === photoId);
    if (!photo) return;

    if (this.selectedPhotos.has(photoId)) {
      // Hapus dari pilihan
      this.selectedPhotos.delete(photoId);
      AppUtil.showToast(`Dibatalkan: ${photo.name}`, 'info', 1800);
    } else {
      // Periksa batas kuota foto
      if (this.selectedPhotos.size >= this.project.limit) {
        AppUtil.showToast(
          `Batas maksimal ${this.project.limit} foto sudah tercapai! Silakan hapus salah satu foto jika ingin memilih foto ini.`,
          'warning',
          4000
        );
        this.highlightLimitExceeded();
        return;
      }

      // Tambahkan ke pilihan
      this.selectedPhotos.set(photoId, photo);
      AppUtil.showToast(`Dipilih: ${photo.name}`, 'success', 1800);

      // Jika pas mencapai kuota, rayakan dengan efek confetti!
      if (this.selectedPhotos.size === this.project.limit && window.confetti) {
        window.confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.85 }
        });
      }
    }

    // Simpan ke autosave browser klien
    this.saveSelectionsLocally();

    // Update tampilan card
    const cardEl = document.getElementById(`card-${photoId}`);
    if (cardEl) {
      const isSelected = this.selectedPhotos.has(photoId);
      if (isSelected) {
        cardEl.classList.add('is-selected');
      } else {
        cardEl.classList.remove('is-selected');
      }

      const badgeBtn = cardEl.querySelector('.select-badge');
      if (badgeBtn) {
        badgeBtn.innerHTML = `<i data-lucide="${isSelected ? 'check' : 'plus'}" class="w-4 h-4"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    }

    this.updateSelectionUI();

    // Update tombol di lightbox jika sedang terbuka
    if (this.currentLightboxIndex >= 0) {
      this.updateLightboxSelectButton();
    }
  },

  /**
   * Update Floating Bar, Counter, dan Progress Bar
   */
  updateSelectionUI() {
    const count = this.selectedPhotos.size;
    const limit = this.project.limit;
    const percent = Math.min(100, Math.round((count / limit) * 100));

    if (this.counterText) {
      this.counterText.innerHTML = `<strong>${count}</strong> / ${limit} Foto`;
    }

    if (this.progressBar) {
      this.progressBar.style.width = `${percent}%`;
      if (count >= limit) {
        this.progressBar.classList.remove('bg-amber-500');
        this.progressBar.classList.add('bg-emerald-500');
      } else {
        this.progressBar.classList.remove('bg-emerald-500');
        this.progressBar.classList.add('bg-amber-500');
      }
    }

    // Update Tab Count
    const tabSelectedCount = document.getElementById('tab-selected-count');
    if (tabSelectedCount) {
      tabSelectedCount.textContent = count;
    }

    // Tampilkan / Sembunyikan Floating Bar
    if (this.floatingBar) {
      this.floatingBar.classList.remove('hidden');
    }
  },

  highlightLimitExceeded() {
    if (this.floatingBar) {
      this.floatingBar.classList.add('pulse-glow');
      setTimeout(() => this.floatingBar.classList.remove('pulse-glow'), 1200);
    }
  },

  /**
   * Autosave: Simpan pilihan foto ke browser klien
   */
  saveSelectionsLocally() {
    const key = `inhistoria_sel_${this.project.id || this.project.folderId}`;
    const ids = Array.from(this.selectedPhotos.keys());
    localStorage.setItem(key, JSON.stringify(ids));
  },

  loadSavedSelections() {
    try {
      const key = `inhistoria_sel_${this.project.id || this.project.folderId}`;
      const savedIds = JSON.parse(localStorage.getItem(key) || '[]');
      this.selectedPhotos.clear();

      if (Array.isArray(savedIds) && this.allPhotos.length > 0) {
        savedIds.forEach(id => {
          const found = this.allPhotos.find(p => p.id === id);
          if (found) this.selectedPhotos.set(id, found);
        });
      }
    } catch (e) {
      console.warn('Gagal memuat autosave lokal:', e);
    }
  },

  /**
   * Tab Filter Switcher (Semua Foto vs Foto Dipilih)
   */
  setFilter(filterType) {
    this.activeFilter = filterType;

    const btnAll = document.getElementById('tab-btn-all');
    const btnSel = document.getElementById('tab-btn-selected');

    if (filterType === 'all') {
      btnAll?.classList.add('bg-neutral-800', 'text-white');
      btnAll?.classList.remove('text-neutral-400');
      btnSel?.classList.remove('bg-neutral-800', 'text-white');
      btnSel?.classList.add('text-neutral-400');
    } else {
      btnSel?.classList.add('bg-neutral-800', 'text-white');
      btnSel?.classList.remove('text-neutral-400');
      btnAll?.classList.remove('bg-neutral-800', 'text-white');
      btnAll?.classList.add('text-neutral-400');
    }

    this.renderGallery();
  },

  /**
   * LIGHTBOX / REVIEW FOTO BESAR
   */
  openLightbox(photoId) {
    const index = this.allPhotos.findIndex(p => p.id === photoId);
    if (index === -1) return;

    this.currentLightboxIndex = index;
    this.updateLightboxContent();

    this.lightboxModal.classList.remove('hidden');
    this.lightboxModal.classList.add('flex');
    document.body.style.overflow = 'hidden'; // Kunci scroll halaman

    if (window.lucide) window.lucide.createIcons();
  },

  closeLightbox() {
    this.currentLightboxIndex = -1;
    this.lightboxModal.classList.add('hidden');
    this.lightboxModal.classList.remove('flex');
    document.body.style.overflow = '';
  },

  updateLightboxContent() {
    const photo = this.allPhotos[this.currentLightboxIndex];
    if (!photo) return;

    // Set gambar preview resolusi tinggi
    this.lightboxImg.src = photo.fullUrl || photo.thumbUrl;
    this.lightboxImg.alt = photo.name;
    this.lightboxTitle.textContent = photo.name;
    this.lightboxIndex.textContent = `${this.currentLightboxIndex + 1} / ${this.allPhotos.length}`;

    this.updateLightboxSelectButton();
  },

  updateLightboxSelectButton() {
    const photo = this.allPhotos[this.currentLightboxIndex];
    if (!photo) return;

    const isSelected = this.selectedPhotos.has(photo.id);

    if (isSelected) {
      this.lightboxSelectBtn.className = 'px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-lg transition';
      this.lightboxSelectBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>Foto Ini Sudah Dipilih</span>`;
    } else {
      this.lightboxSelectBtn.className = 'px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm flex items-center gap-2 border border-white/20 transition';
      this.lightboxSelectBtn.innerHTML = `<i data-lucide="plus" class="w-4 h-4"></i> <span>Pilih Foto Ini</span>`;
    }

    if (window.lucide) window.lucide.createIcons();
  },

  toggleLightboxCurrentPhoto() {
    const photo = this.allPhotos[this.currentLightboxIndex];
    if (photo) {
      this.toggleSelect(null, photo.id);
    }
  },

  lightboxNext() {
    if (this.allPhotos.length === 0) return;
    this.currentLightboxIndex = (this.currentLightboxIndex + 1) % this.allPhotos.length;
    this.updateLightboxContent();
  },

  lightboxPrev() {
    if (this.allPhotos.length === 0) return;
    this.currentLightboxIndex = (this.currentLightboxIndex - 1 + this.allPhotos.length) % this.allPhotos.length;
    this.updateLightboxContent();
  },

  /**
   * Gestur Keyboard & Swipe Mobile untuk Review Foto
   */
  initKeyboardAndTouch() {
    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (this.currentLightboxIndex >= 0) {
        if (e.key === 'Escape') this.closeLightbox();
        if (e.key === 'ArrowRight') this.lightboxNext();
        if (e.key === 'ArrowLeft') this.lightboxPrev();
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          this.toggleLightboxCurrentPhoto();
        }
      }
    });

    // Mobile touch swipe pada Lightbox
    let touchStartX = 0;
    let touchEndX = 0;

    const lightboxArea = document.getElementById('lightbox-touch-area');
    if (lightboxArea) {
      lightboxArea.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      lightboxArea.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diffX = touchEndX - touchStartX;
        if (Math.abs(diffX) > 50) {
          if (diffX < 0) {
            this.lightboxNext(); // Swipe ke kiri -> Next
          } else {
            this.lightboxPrev(); // Swipe ke kanan -> Prev
          }
        }
      }, { passive: true });
    }
  },

  /**
   * MODAL REVIEW PILIHAN & PENGIRIMAN WHATSAPP
   */
  openReviewModal() {
    const container = document.getElementById('review-photos-grid');
    const countBadge = document.getElementById('review-count-badge');
    const selectedArray = Array.from(this.selectedPhotos.values());

    if (countBadge) {
      countBadge.textContent = `${selectedArray.length} / ${this.project.limit} Foto Terpilih`;
    }

    if (container) {
      if (selectedArray.length === 0) {
        container.innerHTML = `
          <div class="col-span-full py-12 text-center text-neutral-400">
            <i data-lucide="image" class="w-10 h-10 mx-auto mb-2 text-neutral-600"></i>
            <p class="text-sm">Kamu belum memilih foto apa pun.</p>
          </div>
        `;
      } else {
        container.innerHTML = selectedArray.map(photo => `
          <div class="relative group rounded-xl overflow-hidden bg-neutral-900 border border-white/10 aspect-square">
            <img src="${photo.thumbUrl}" alt="${photo.name}" class="w-full h-full object-cover" />
            <button onclick="GalleryApp.removeSelectionFromReview('${photo.id}')" 
                    title="Hapus dari pilihan"
                    class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center transition shadow">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
            <div class="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm p-1.5 text-center">
              <span class="text-[10px] font-mono text-white/90 truncate block">${photo.name}</span>
            </div>
          </div>
        `).join('');
      }
    }

    // Susun pesan WhatsApp
    const selectedCodes = selectedArray.map(p => p.name);
    const waData = AppUtil.buildWhatsAppMessage({
      clientName: this.project.client,
      selectedCodes: selectedCodes,
      limit: this.project.limit,
      photographerPhone: this.project.phone
    });

    const sendWABtn = document.getElementById('btn-send-wa-final');
    if (sendWABtn) {
      sendWABtn.onclick = () => {
        if (selectedCodes.length === 0) {
          AppUtil.showToast('Pilih minimal 1 foto terlebih dahulu sebelum mengirim!', 'warning');
          return;
        }
        window.open(waData.waUrl, '_blank');
      };
    }

    // Tombol Salin Format Lightroom
    const copyLrBtn = document.getElementById('btn-copy-lightroom');
    if (copyLrBtn) {
      copyLrBtn.onclick = () => {
        if (selectedCodes.length === 0) {
          AppUtil.showToast('Belum ada foto yang dipilih.', 'warning');
          return;
        }
        AppUtil.copyToClipboard(waData.lightroomQuery, 'Format Lightroom berhasil disalin!');
      };
    }

    // Tombol Salin List Teks
    const copyListBtn = document.getElementById('btn-copy-list');
    if (copyListBtn) {
      copyListBtn.onclick = () => {
        if (selectedCodes.length === 0) {
          AppUtil.showToast('Belum ada foto yang dipilih.', 'warning');
          return;
        }
        AppUtil.copyToClipboard(waData.message, 'Daftar kode foto berhasil disalin!');
      };
    }

    // Tombol Download File TXT
    const downloadTxtBtn = document.getElementById('btn-download-txt');
    if (downloadTxtBtn) {
      downloadTxtBtn.onclick = () => {
        if (selectedCodes.length === 0) {
          AppUtil.showToast('Belum ada foto yang dipilih.', 'warning');
          return;
        }
        const fileNameSafe = `${this.project.client.replace(/[^a-zA-Z0-9_-]/g, '_')}_Pilihan_Foto.txt`;
        AppUtil.downloadTxtFile(fileNameSafe, waData.message);
      };
    }

    this.reviewModal.classList.remove('hidden');
    this.reviewModal.classList.add('flex');

    if (window.lucide) window.lucide.createIcons();
  },

  closeReviewModal() {
    this.reviewModal.classList.add('hidden');
    this.reviewModal.classList.remove('flex');
  },

  removeSelectionFromReview(photoId) {
    this.toggleSelect(null, photoId);
    this.openReviewModal(); // Re-render modal review
    this.renderGallery();
  },

  resetAllSelections() {
    if (confirm('Apakah Anda yakin ingin membatalkan semua foto yang sudah dipilih?')) {
      this.selectedPhotos.clear();
      this.saveSelectionsLocally();
      this.renderGallery();
      this.updateSelectionUI();
      this.closeReviewModal();
      AppUtil.showToast('Semua pilihan foto telah direset.', 'info');
    }
  },

  showErrorScreen(msg) {
    const errorEl = document.getElementById('error-screen');
    const errorMsgEl = document.getElementById('error-message-text');
    if (errorEl && errorMsgEl) {
      errorMsgEl.textContent = msg;
      errorEl.classList.remove('hidden');
      if (this.loadingIndicator) this.loadingIndicator.classList.add('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  }
};

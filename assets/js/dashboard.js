/**
 * Inhistoria Photography - Dashboard Logic
 * Mengelola form pembuatan project, validasi link Google Drive, generator link unik, dan riwayat project
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi ikon Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initDashboard();
});

function initDashboard() {
  const form = document.getElementById('project-form');
  const clientNameInput = document.getElementById('client-name');
  const driveLinkInput = document.getElementById('drive-link');
  const limitInput = document.getElementById('photo-limit');
  const phoneInput = document.getElementById('phone-number');
  const notesInput = document.getElementById('client-notes');
  const isDemoCheckbox = document.getElementById('is-demo');

  const btnCheckFolder = document.getElementById('btn-check-folder');
  const checkResult = document.getElementById('check-result');

  // Load setting WhatsApp fotografer yang tersimpan
  const savedPhone = localStorage.getItem('inhistoria_default_phone') || '';
  if (savedPhone && phoneInput) {
    phoneInput.value = savedPhone;
  }

  // Quick preset buttons untuk batas foto (10, 15, 20, 25, 30, 50)
  document.querySelectorAll('.btn-preset-limit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = btn.getAttribute('data-limit');
      if (limitInput && val) {
        limitInput.value = val;
      }
    });
  });

  // Tombol Cek Folder Google Drive
  if (btnCheckFolder) {
    btnCheckFolder.addEventListener('click', async () => {
      const link = driveLinkInput.value.trim();
      const isDemo = isDemoCheckbox ? isDemoCheckbox.checked : false;

      if (isDemo) {
        checkResult.innerHTML = `
          <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>
            <span>Mode Demo Aktif: 24 foto simulasi beresolusi tinggi siap digunakan.</span>
          </div>`;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      if (!link) {
        AppUtil.showToast('Harap masukkan Link Folder Google Drive terlebih dahulu', 'warning');
        driveLinkInput.focus();
        return;
      }

      const folderId = DriveService.extractFolderId(link);
      if (!folderId) {
        AppUtil.showToast('Format link Google Drive tidak valid', 'error');
        return;
      }

      const apiKey = DriveService.getStoredApiKey();
      if (!apiKey) {
        AppUtil.showToast('Google Drive API Key belum disetting. Buka menu Pengaturan API Key di pojok kanan atas.', 'warning');
        openSettingsModal();
        return;
      }

      btnCheckFolder.disabled = true;
      btnCheckFolder.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Memeriksa folder...`;
      checkResult.innerHTML = '';

      try {
        const photos = await DriveService.fetchFolderPhotos(folderId, apiKey);
        checkResult.innerHTML = `
          <div class="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>
              <span>Folder terhubung! Ditemukan <strong>${photos.length} foto</strong> siap dipilih klien.</span>
            </div>
            <span class="text-[11px] bg-emerald-800/60 text-emerald-200 px-2 py-0.5 rounded-full font-mono">${photos[0]?.name || ''} ...</span>
          </div>`;
        AppUtil.showToast(`Berhasil menemukan ${photos.length} foto!`, 'success');
      } catch (err) {
        checkResult.innerHTML = `
          <div class="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex flex-col gap-1.5">
            <div class="flex items-center gap-2 font-semibold">
              <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-400 flex-shrink-0"></i>
              <span>Gagal mengakses Google Drive:</span>
            </div>
            <p class="text-rose-200/80 leading-relaxed">${err.message}</p>
            <p class="text-[11px] text-amber-300 mt-1">Tips: Pastikan folder diset "Siapa saja yang memiliki link dapat melihat" dan API Key sudah aktif.</p>
          </div>`;
      } finally {
        btnCheckFolder.disabled = false;
        btnCheckFolder.innerHTML = `<i data-lucide="refresh-cw" class="w-4 h-4 mr-1.5"></i> Cek & Hitung Foto`;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // Handle Submit Form Pembuatan Project Gallery
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const clientName = clientNameInput.value.trim();
      const driveLink = driveLinkInput.value.trim();
      const limit = parseInt(limitInput.value, 10) || 20;
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const notes = notesInput ? notesInput.value.trim() : '';
      const isDemo = isDemoCheckbox ? isDemoCheckbox.checked : false;

      if (!clientName) {
        AppUtil.showToast('Nama Klien wajib diisi (contoh: DIANA - UIN)', 'warning');
        clientNameInput.focus();
        return;
      }

      let folderId = '';
      if (!isDemo) {
        if (!driveLink) {
          AppUtil.showToast('Link Google Drive wajib diisi, atau centang Mode Demo untuk mencoba', 'warning');
          driveLinkInput.focus();
          return;
        }
        folderId = DriveService.extractFolderId(driveLink);
        if (!folderId) {
          AppUtil.showToast('Link Google Drive tidak valid', 'error');
          return;
        }
      }

      // Simpan nomor WhatsApp default fotografer jika diisi
      if (phone) {
        localStorage.setItem('inhistoria_default_phone', phone);
      }

      // Buat objek project
      const projectId = 'proj_' + Date.now();
      const apiKey = DriveService.getStoredApiKey();

      const projectData = {
        id: projectId,
        client: clientName,
        folderId: isDemo ? 'demo' : folderId,
        driveUrl: driveLink,
        limit: limit,
        phone: phone,
        notes: notes,
        isDemo: isDemo,
        apiKey: apiKey || '', // disisipkan agar klien bisa langsung load tanpa login
        createdAt: new Date().toISOString()
      };

      // Simpan project ke daftar riwayat lokal
      AppUtil.saveProject(projectData);

      // Render ulang daftar riwayat
      renderProjectList();

      // Buat Link Khusus Gallery
      const encodedParam = AppUtil.encodeProject(projectData);
      
      // Deteksi path dasar halaman gallery
      const currentUrl = window.location.href;
      let baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
      const galleryUrl = `${baseUrl}gallery.html?p=${encodedParam}`;

      // Buka modal hasil project
      openProjectResultModal({
        ...projectData,
        galleryUrl
      });

      AppUtil.showToast('Project Gallery berhasil dibuat!', 'success');
    });
  }

  // Render daftar project yang tersimpan
  renderProjectList();

  // Setup Event Modal Pengaturan API Key
  setupSettingsModal();
}

/**
 * Render Riwayat Project di Dashboard
 */
function renderProjectList() {
  const container = document.getElementById('project-list-container');
  const emptyState = document.getElementById('project-empty-state');
  if (!container) return;

  const projects = AppUtil.getSavedProjects();

  if (projects.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  let currentUrl = window.location.href;
  let baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);

  container.innerHTML = projects.map(proj => {
    const encoded = AppUtil.encodeProject(proj);
    const galleryUrl = `${baseUrl}gallery.html?p=${encoded}`;
    const dateFormatted = new Date(proj.createdAt || Date.now()).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return `
      <div class="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-white/20">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center text-amber-300 font-serif font-bold text-lg flex-shrink-0">
            ${proj.client.charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h3 class="font-semibold text-base text-white">${proj.client}</h3>
              <span class="text-[11px] px-2.5 py-0.5 rounded-full font-medium ${proj.isDemo ? 'bg-purple-900/40 text-purple-300 border border-purple-500/30' : 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30'}">
                ${proj.isDemo ? 'Mode Demo' : 'Google Drive'}
              </span>
              <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono">
                Batas: ${proj.limit} Foto
              </span>
            </div>
            <p class="text-xs text-neutral-400 mt-1 flex items-center gap-3">
              <span><i data-lucide="calendar" class="w-3.5 h-3.5 inline mr-1 text-neutral-500"></i>${dateFormatted}</span>
              ${proj.phone ? `<span><i data-lucide="phone" class="w-3.5 h-3.5 inline mr-1 text-neutral-500"></i>+${AppUtil.formatWhatsAppNumber(proj.phone)}</span>` : ''}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap md:flex-nowrap">
          <button onclick="copyProjectLink('${galleryUrl}')" class="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition flex items-center justify-center gap-1.5 border border-white/5">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i> Salin Link
          </button>
          <a href="${galleryUrl}" target="_blank" class="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition flex items-center justify-center gap-1.5">
            <i data-lucide="external-link" class="w-3.5 h-3.5"></i> Buka Gallery
          </a>
          <button onclick="deleteSavedProject('${proj.id}')" class="p-2 rounded-xl bg-neutral-800/60 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-300 border border-white/5 hover:border-rose-500/30 text-xs transition" title="Hapus Project">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Salin Link Project
 */
window.copyProjectLink = function(url) {
  AppUtil.copyToClipboard(url, 'Link Gallery Klien berhasil disalin! Tinggal kirim ke Klien.');
};

/**
 * Hapus Project
 */
window.deleteSavedProject = function(id) {
  if (confirm('Apakah Anda yakin ingin menghapus riwayat project ini?')) {
    AppUtil.deleteProject(id);
    renderProjectList();
    AppUtil.showToast('Project dihapus dari riwayat lokal', 'info');
  }
};

/**
 * Buka Modal Hasil Pembuatan Link Project
 */
function openProjectResultModal(proj) {
  const modal = document.getElementById('result-modal');
  if (!modal) return;

  document.getElementById('res-client-name').textContent = proj.client;
  document.getElementById('res-limit').textContent = `${proj.limit} Foto`;
  document.getElementById('res-url-input').value = proj.galleryUrl;

  const btnOpen = document.getElementById('btn-open-res-gallery');
  if (btnOpen) {
    btnOpen.href = proj.galleryUrl;
  }

  // Tombol Kirim Undangan Link ke WhatsApp Klien
  const btnSendClientWA = document.getElementById('btn-send-client-wa');
  if (btnSendClientWA) {
    const inviteMessage = 
`Halo Kak *${proj.client}*! ✨
Terima kasih telah mempercayakan momen terbaikmu bersama *Inhistoria Photography*. 📸

Berikut adalah link khusus gallery foto untuk memilih foto pilihanmu:
👉 ${proj.galleryUrl}

*Ketentuan Pemilihan:*
- Batas maksimal foto yang dipilih: *${proj.limit} foto*
- Kamu bisa buka link di HP maupun laptop
- Klik foto untuk memperbesar / review detail
- Setelah selesai, cukup klik tombol *"Kirim ke WhatsApp"* di bagian bawah gallery.

Selamat memilih foto favoritmu ya Kak! Jika ada kendala, hubungi kami kapan saja. 🤍`;

    btnSendClientWA.onclick = () => {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
      window.open(waUrl, '_blank');
    };
  }

  // Generate QR Code untuk kemudahan scan di HP
  const qrContainer = document.getElementById('res-qrcode');
  if (qrContainer) {
    qrContainer.innerHTML = '';
    if (window.QRCode) {
      new QRCode(qrContainer, {
        text: proj.galleryUrl,
        width: 140,
        height: 140,
        colorDark: "#ffffff",
        colorLight: "#12161f",
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Tutup Modal Hasil
 */
window.closeResultModal = function() {
  const modal = document.getElementById('result-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
};

/**
 * Setup Pengaturan Google Drive API Key Modal
 */
function setupSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const btnOpen = document.getElementById('btn-open-settings');
  const btnClose = document.getElementById('btn-close-settings');
  const btnSave = document.getElementById('btn-save-settings');
  const apiKeyInput = document.getElementById('settings-api-key');
  const phoneSettingInput = document.getElementById('settings-default-phone');

  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      openSettingsModal();
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', () => {
      closeSettingsModal();
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
      const defaultPhone = phoneSettingInput ? phoneSettingInput.value.trim() : '';

      DriveService.saveApiKey(apiKey);
      if (defaultPhone) {
        localStorage.setItem('inhistoria_default_phone', defaultPhone);
        const mainPhone = document.getElementById('phone-number');
        if (mainPhone) mainPhone.value = defaultPhone;
      }

      AppUtil.showToast('Pengaturan API Key berhasil disimpan!', 'success');
      closeSettingsModal();
    });
  }
}

function openSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const apiKeyInput = document.getElementById('settings-api-key');
  const phoneSettingInput = document.getElementById('settings-default-phone');

  if (apiKeyInput) {
    apiKeyInput.value = DriveService.getStoredApiKey();
  }
  if (phoneSettingInput) {
    phoneSettingInput.value = localStorage.getItem('inhistoria_default_phone') || '';
  }

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();
  }
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}
window.closeSettingsModal = closeSettingsModal;

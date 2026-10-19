/**
 * Inhistoria Photography - Google Drive & Image Service
 * Mengambil foto dari folder Google Drive publik menggunakan Google Drive API v3
 * Menghasilkan link thumbnail cepat (CDN) & resolusi tinggi untuk preview
 */

const DriveService = {
  // Key penyimpanan lokal untuk Google Drive API Key fotografer
  STORAGE_KEY_API: 'inhistoria_gdrive_api_key',

  // Ambil API key yang tersimpan di browser fotografer
  getStoredApiKey() {
    return localStorage.getItem(this.STORAGE_KEY_API) || '';
  },

  // Simpan API key ke browser
  saveApiKey(apiKey) {
    if (apiKey) {
      localStorage.setItem(this.STORAGE_KEY_API, apiKey.trim());
    } else {
      localStorage.removeItem(this.STORAGE_KEY_API);
    }
  },

  /**
   * Ekstrak Google Drive Folder ID dari berbagai format URL
   * Contoh input yang didukung:
   * - https://drive.google.com/drive/folders/1A2B3C4D5E...
   * - https://drive.google.com/drive/u/0/folders/1A2B3C4D5E...
   * - https://drive.google.com/open?id=1A2B3C4D5E...
   * - 1A2B3C4D5E... (hanya ID saja)
   */
  extractFolderId(input) {
    if (!input) return '';
    const trimmed = input.trim();

    // Cek format /folders/ID
    const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]{20,})/);
    if (folderMatch && folderMatch[1]) return folderMatch[1];

    // Cek format id=ID
    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
    if (idMatch && idMatch[1]) return idMatch[1];

    // Jika user langsung memasukkan folder ID
    if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
      return trimmed;
    }

    return trimmed;
  },

  /**
   * Bangun URL Gambar Google Drive (Fast CDN)
   * Menggunakan endpoint lh3.googleusercontent.com yang sangat cepat dan ringan
   */
  getImageUrls(fileId) {
    return {
      // Thumbnail untuk grid foto (lebar 600px - hemat kuota & cepat)
      thumb: `https://lh3.googleusercontent.com/d/${fileId}=w600`,
      // Preview besar untuk lightbox/review (lebar 1600px)
      full: `https://lh3.googleusercontent.com/d/${fileId}=w1600`,
      // Fallback url jika CDN lh3 diblokir provider
      fallback: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
      // Link asli drive
      driveLink: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
    };
  },

  /**
   * Ambil daftar file dari Google Drive Folder publik menggunakan Drive API v3
   * @param {string} folderId 
   * @param {string} apiKey 
   * @returns {Promise<Array>} Daftar foto [{ id, name, thumbUrl, fullUrl, size }]
   */
  async fetchFolderPhotos(folderId, apiKey) {
    const key = apiKey || this.getStoredApiKey();

    if (!folderId) {
      throw new Error('ID Folder Google Drive tidak valid.');
    }

    if (!key) {
      throw new Error('Google Drive API Key belum diisi. Silakan masukkan API Key di menu Pengaturan.');
    }

    let allFiles = [];
    let pageToken = '';
    const pageSize = 500;

    // Filter file gambar: mimeType mengandung image atau nama file memiliki ekstensi gambar
    const query = `'${folderId}' in parents and trashed = false`;

    do {
      let endpoint = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=${pageSize}&fields=nextPageToken,files(id,name,mimeType,size,createdTime)&orderBy=name&key=${key}`;
      
      if (pageToken) {
        endpoint += `&pageToken=${encodeURIComponent(pageToken)}`;
      }

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || response.statusText;
        if (response.status === 404) {
          throw new Error('Folder Google Drive tidak ditemukan. Pastikan folder tersebut sudah diatur ke "Siapa saja yang memiliki link dapat melihat".');
        } else if (response.status === 403) {
          throw new Error(`Akses Google Drive ditolak: ${message}. Pastikan Google Drive API v3 sudah di-enable di Google Cloud Console dan folder sudah dibuat publik.`);
        } else {
          throw new Error(`Gagal memuat foto: ${message}`);
        }
      }

      const data = await response.json();
      if (data.files && Array.isArray(data.files)) {
        allFiles = allFiles.concat(data.files);
      }
      pageToken = data.nextPageToken || '';
    } while (pageToken);

    // Filter hanya file gambar atau file foto kamera (JPG, PNG, CR2, CR3, ARW, NEF, DNG, WEBP)
    const validImageExtensions = /\.(jpg|jpeg|png|webp|cr2|cr3|nef|arw|dng|heic)$/i;
    const photoFiles = allFiles.filter(f => {
      const isMimeImage = f.mimeType && f.mimeType.startsWith('image/');
      const hasImageExt = validImageExtensions.test(f.name);
      return isMimeImage || hasImageExt;
    });

    // Urutkan berdasarkan nama file secara natural (DSC001, DSC002, dst.)
    photoFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    return photoFiles.map(file => {
      const urls = this.getImageUrls(file.id);
      return {
        id: file.id,
        name: file.name,
        thumbUrl: urls.thumb,
        fullUrl: urls.full,
        fallbackUrl: urls.fallback,
        driveLink: urls.driveLink,
        size: file.size ? parseInt(file.size, 10) : 0
      };
    });
  },

  /**
   * Data foto demo / simulasi untuk testing langsung jika user belum pasang API Key
   */
  getDemoPhotos(clientName = 'DIANA - UIN') {
    const demoList = [
      { id: 'demo-01', code: 'INH_0192.JPG', tag: 'Graduation Portrait', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-02', code: 'INH_0195.JPG', tag: 'Graduation Ceremony', img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-03', code: 'INH_0201.JPG', tag: 'With Friends', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-04', code: 'INH_0204.JPG', tag: 'Smile Close Up', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-05', code: 'DSC_8391.JPG', tag: 'Toga & Bouqet', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-06', code: 'DSC_8394.JPG', tag: 'Full Body Portrait', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-07', code: 'DSC_8402.JPG', tag: 'Campus Garden', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-08', code: 'DSC_8410.JPG', tag: 'Toss Hat', img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-09', code: 'IMG_4021.JPG', tag: 'Family Portrait', img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-10', code: 'IMG_4025.JPG', tag: 'Sunset Glow', img: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-11', code: 'IMG_4030.JPG', tag: 'Candid Laugh', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-12', code: 'IMG_4042.JPG', tag: 'Academic Diploma', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-13', code: 'INH_0220.JPG', tag: 'Library Stairs', img: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-14', code: 'INH_0225.JPG', tag: 'Black Toga Classic', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-15', code: 'INH_0230.JPG', tag: 'Bokeh Studio', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-16', code: 'DSC_8422.JPG', tag: 'Warm Aesthetic', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-17', code: 'DSC_8430.JPG', tag: 'Editorial Pose', img: 'https://images.unsplash.com/photo-1526510747491-58f928ec870f?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-18', code: 'DSC_8435.JPG', tag: 'Side Profile', img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-19', code: 'IMG_4050.JPG', tag: 'Graduation Flowers', img: 'https://images.unsplash.com/photo-1496440737103-cd596325d314?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-20', code: 'IMG_4055.JPG', tag: 'Happy Graduation', img: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-21', code: 'INH_0240.JPG', tag: 'Friendship Forever', img: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-22', code: 'INH_0248.JPG', tag: 'Ceremony Walk', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-23', code: 'DSC_8450.JPG', tag: 'Proud Parents', img: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1000&q=80' },
      { id: 'demo-24', code: 'DSC_8460.JPG', tag: 'Final Celebration', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80' },
    ];

    return demoList.map(item => ({
      id: item.id,
      name: item.code,
      thumbUrl: item.img,
      fullUrl: item.img,
      fallbackUrl: item.img,
      driveLink: item.img,
      size: 3500000
    }));
  }
};

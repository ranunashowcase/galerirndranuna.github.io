const SUPABASE_URL = 'https://vojohaceijgiotlnnkda.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvam9oYWNlaWpnaW90bG5ua2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjQyNjgsImV4cCI6MjA5MzQ0MDI2OH0.bfPdCT_ht3NU9EYk7Ku43kvT6uL7sx0S3758Apg7ESI';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

var galleries = {};
var activeCode = null;
var selectedFileData = null;

var urlParams = new URLSearchParams(window.location.search);
var embedCode = urlParams.get('embed');
var directCode = urlParams.get('code');

async function loadData() {
  try {
    var r1 = await sb.from('gallery_codes').select('code').order('created_at');
    var r2 = await sb.from('gallery_images').select('*').order('created_at');
    galleries = {};
    if (r1.data) r1.data.forEach(function(c) { galleries[c.code] = []; });
    if (r2.data) r2.data.forEach(function(img) {
      if (galleries[img.code]) galleries[img.code].push({ id: img.id, title: img.title, url: img.image_url });
    });
  } catch (e) {
    console.error('Load error:', e);
    galleries = {};
  }
  if (embedCode) { activeCode = embedCode; }
  else if (urlParams.get('preview')) { activeCode = urlParams.get('preview'); }
  else if (directCode && galleries[directCode]) { activeCode = directCode; }
  else {
    var saved = localStorage.getItem('rnd_activeCode');
    if (saved && galleries[saved]) activeCode = saved;
    else { var keys = Object.keys(galleries); activeCode = keys.length > 0 ? keys[0] : null; }
  }
}

function renderApp() {
  if (embedCode) {
    document.querySelector('aside').style.display = 'none';
    renderEmbedContent();
  } else if (urlParams.get('preview')) {
    document.querySelector('aside').style.display = 'none';
    renderPreviewContent();
  } else {
    renderSidebar();
    renderMainContent();
  }
  lucide.createIcons();
}

function renderEmbedContent() {
  var mc = document.getElementById('mainContent');
  mc.className = 'flex-1 flex flex-col h-full overflow-hidden bg-white';
  var images = galleries[embedCode] || [];
  if (images.length === 0) {
    mc.innerHTML = '<div class="h-full flex flex-col items-center justify-center text-center p-4"><i data-lucide="image" class="w-10 h-10 text-gray-300 mb-2"></i><p class="text-gray-500 text-sm font-medium">Belum ada gambar</p><p class="text-xs text-gray-400 mt-1">Kode: ' + embedCode + '</p></div>';
  } else {
    var html = '<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4 h-full overflow-y-auto">';
    images.forEach(function(img) {
      html += '<div class="aspect-square bg-gray-100 rounded-xl overflow-hidden relative group cursor-pointer" onclick="openLightbox(\'' + img.url + '\', \'' + img.title.replace(/'/g, "\\'") + '\')"><img src="' + img.url + '" alt="' + img.title + '" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" /><div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center"><span class="text-white text-xs font-medium truncate w-full">' + img.title + '</span></div></div>';
    });
    html += '</div>';
    mc.innerHTML = html;
  }
}

function renderPreviewContent() {
  var mc = document.getElementById('mainContent');
  var code = urlParams.get('preview');
  var images = galleries[code] || [];
  if (images.length === 0) {
    mc.innerHTML = '<div class="h-full w-full bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center"><i data-lucide="layers" class="w-8 h-8 text-blue-300 mb-2"></i><span class="px-3 py-1 bg-white/60 backdrop-blur-sm rounded-lg text-xs font-bold text-blue-700 tracking-wider shadow-sm border border-blue-100/50">' + code + '</span></div>';
  } else {
    var img = images[0];
    mc.innerHTML = '<div class="h-full w-full relative"><img src="' + img.url + '" alt="' + img.title + '" class="w-full h-full object-cover" /><div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div></div>';
  }
}

function renderSidebar() {
  var lc = document.getElementById('galleryList');
  var codes = Object.keys(galleries);
  if (codes.length === 0) {
    lc.innerHTML = '<div class="text-sm text-gray-500 italic text-center py-4">Belum ada galeri.</div>';
    return;
  }
  var html = '';
  codes.forEach(function(code) {
    var isActive = activeCode === code;
    var count = galleries[code].length;
    html += '<div onclick="setActiveCode(\'' + code + '\')" class="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ' + (isActive ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'hover:bg-gray-100 text-gray-600 border border-transparent') + '"><div class="flex items-center gap-3 truncate"><i data-lucide="folder" class="w-4 h-4 ' + (isActive ? 'text-blue-500' : 'text-gray-400') + '"></i><span class="font-medium text-sm truncate">' + code + '</span></div><div class="flex items-center gap-2"><span class="text-xs bg-white px-2 py-1 rounded-full shadow-sm border border-gray-100">' + count + '</span></div></div>';
  });
  lc.innerHTML = html;
}

function renderMainContent() {
  var mc = document.getElementById('mainContent');
  if (!activeCode) {
    mc.innerHTML = '<div class="h-full flex flex-col items-center justify-center text-center p-8"><i data-lucide="folder" class="w-16 h-16 text-gray-300 mb-4"></i><h2 class="text-xl font-medium text-gray-600 mb-2">Pilih atau Buat Kode Unik</h2><p class="text-gray-400 text-sm max-w-md">Pilih folder dari menu di sebelah kiri untuk melihat galeri produk, atau buat kode unik baru.</p></div>';
    return;
  }
  var images = galleries[activeCode];
  var gridContent = '';
  if (images.length === 0) {
    gridContent = '<div class="h-full flex flex-col items-center justify-center text-center"><div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-gray-300"><i data-lucide="image" class="w-10 h-10 text-gray-400"></i></div><h3 class="text-lg font-medium text-gray-900 mb-1">Galeri Masih Kosong</h3><p class="text-gray-500 text-sm max-w-sm mb-6">Belum ada gambar untuk kode ' + activeCode + '.</p><button onclick="openUploadModal()" class="text-blue-600 font-medium hover:underline flex items-center gap-1"><i data-lucide="plus" class="w-4 h-4"></i> Unggah Gambar Pertama</button></div>';
  } else {
    gridContent = '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">';
    images.forEach(function(img) {
      gridContent += '<div class="group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"><div class="aspect-[4/3] bg-gray-100 relative overflow-hidden"><img src="' + img.url + '" alt="' + img.title + '" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" /><div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3"><button onclick="openLightbox(\'' + img.url + '\', \'' + img.title.replace(/'/g, "\\'") + '\')" class="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full text-white transition-colors" title="Perbesar"><i data-lucide="maximize-2" class="w-5 h-5"></i></button><button onclick="handleDeleteImage(\'' + img.id + '\')" class="p-2 bg-red-500/80 hover:bg-red-600 backdrop-blur-sm rounded-full text-white transition-colors" title="Hapus"><i data-lucide="trash-2" class="w-5 h-5"></i></button></div></div><div class="p-4"><h4 class="font-medium text-gray-800 truncate" title="' + img.title + '">' + img.title + '</h4></div></div>';
    });
    gridContent += '</div>';
  }
  mc.innerHTML = '<header class="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10"><div><div class="flex items-center gap-2 text-sm text-gray-500 mb-1"><span>Galeri</span><i data-lucide="chevron-right" class="w-4 h-4"></i><span class="font-medium text-blue-600">' + activeCode + '</span></div><h2 class="text-2xl font-bold text-gray-900 flex items-center gap-3">' + activeCode + '<button onclick="handleDeleteGallery(\'' + activeCode + '\')" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Hapus Galeri Ini"><i data-lucide="trash-2" class="w-4 h-4"></i></button></h2></div><button onclick="openUploadModal()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-200"><i data-lucide="upload" class="w-4 h-4"></i> Unggah Gambar</button></header><div class="flex-1 overflow-y-auto p-8">' + gridContent + '</div>';
}

function setActiveCode(code) {
  activeCode = code;
  if (!embedCode) localStorage.setItem('rnd_activeCode', activeCode || '');
  renderApp();
}

function openAddGalleryModal() {
  document.getElementById('addGalleryModal').classList.remove('hidden');
  document.getElementById('newGalleryCode').focus();
}
function closeAddGalleryModal() {
  document.getElementById('addGalleryModal').classList.add('hidden');
  document.getElementById('newGalleryCode').value = '';
}

async function handleCreateGallery(e) {
  e.preventDefault();
  var code = document.getElementById('newGalleryCode').value.trim().toUpperCase();
  if (!code) return;
  if (galleries[code]) { alert('Kode unik ini sudah ada!'); return; }
  try {
    var res = await sb.from('gallery_codes').insert({ code: code });
    if (res.error) throw res.error;
    galleries[code] = [];
    activeCode = code;
    localStorage.setItem('rnd_activeCode', activeCode);
    closeAddGalleryModal();
    renderApp();
  } catch (err) { alert('Gagal membuat galeri: ' + err.message); }
}

async function handleDeleteGallery(codeToDelete) {
  if (!confirm('Hapus galeri ' + codeToDelete + ' beserta semua gambar?')) return;
  try {
    var imgs = galleries[codeToDelete] || [];
    for (var i = 0; i < imgs.length; i++) {
      var path = getStoragePath(imgs[i].url);
      if (path) await sb.storage.from('rnd-gallery').remove([path]);
    }
    await sb.from('gallery_codes').delete().eq('code', codeToDelete);
    delete galleries[codeToDelete];
    if (activeCode === codeToDelete) {
      var remaining = Object.keys(galleries);
      activeCode = remaining.length > 0 ? remaining[0] : null;
    }
    renderApp();
  } catch (err) { alert('Gagal menghapus: ' + err.message); }
}

function getStoragePath(url) {
  if (!url || url.indexOf('rnd-gallery') === -1) return null;
  var parts = url.split('/rnd-gallery/');
  return parts.length > 1 ? parts[1] : null;
}

function openUploadModal() {
  if (!activeCode) return;
  document.getElementById('uploadModalTitle').innerText = 'Unggah ke ' + activeCode;
  document.getElementById('uploadModal').classList.remove('hidden');
}
function closeUploadModal() {
  document.getElementById('uploadModal').classList.add('hidden');
  clearSelectedFile();
}

function handleFileChange(e) {
  var file = e.target.files[0];
  if (!file) return;
  var dropzone = document.getElementById('uploadDropzone');
  // Use the original file directly — no compression, no resize
  selectedFileData = file;
  dropzone.classList.add('hidden');
  document.getElementById('uploadPreviewContainer').classList.remove('hidden');
  document.getElementById('uploadPreviewImage').src = URL.createObjectURL(file);
  document.getElementById('uploadImageTitle').disabled = false;
  document.getElementById('saveImageBtn').disabled = false;
  document.getElementById('uploadImageTitle').focus();
}

function clearSelectedFile() {
  selectedFileData = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('uploadImageTitle').value = '';
  document.getElementById('uploadDropzone').classList.remove('hidden');
  document.getElementById('uploadPreviewContainer').classList.add('hidden');
  document.getElementById('uploadPreviewImage').src = '';
  document.getElementById('uploadImageTitle').disabled = true;
  document.getElementById('saveImageBtn').disabled = true;
}

async function handleSaveImage(e) {
  e.preventDefault();
  if (!selectedFileData || !activeCode) return;
  var btn = document.getElementById('saveImageBtn');
  btn.disabled = true;
  btn.textContent = 'Mengunggah...';
  try {
    // Detect original file extension and content type
    var origName = selectedFileData.name || 'image';
    var ext = origName.split('.').pop().toLowerCase();
    var mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp', tiff: 'image/tiff', svg: 'image/svg+xml' };
    var contentType = mimeMap[ext] || selectedFileData.type || 'image/jpeg';
    if (!mimeMap[ext]) ext = 'jpg'; // fallback extension
    var fileName = activeCode + '/' + Date.now() + '.' + ext;
    var uploadRes = await sb.storage.from('rnd-gallery').upload(fileName, selectedFileData, { contentType: contentType });
    if (uploadRes.error) throw uploadRes.error;
    var urlData = sb.storage.from('rnd-gallery').getPublicUrl(fileName);
    var imageUrl = urlData.data.publicUrl;
    var title = document.getElementById('uploadImageTitle').value.trim() || 'Tanpa Judul';
    var insertRes = await sb.from('gallery_images').insert({ code: activeCode, title: title, image_url: imageUrl }).select().single();
    if (insertRes.error) throw insertRes.error;
    galleries[activeCode].push({ id: insertRes.data.id, title: title, url: imageUrl });
    closeUploadModal();
    renderApp();
  } catch (err) {
    alert('Gagal upload: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Simpan Gambar';
  }
}

async function handleDeleteImage(imageId) {
  if (!confirm('Hapus gambar ini?')) return;
  try {
    var found = null;
    galleries[activeCode].forEach(function(i) { if (i.id === imageId) found = i; });
    if (found) {
      var path = getStoragePath(found.url);
      if (path) await sb.storage.from('rnd-gallery').remove([path]);
    }
    await sb.from('gallery_images').delete().eq('id', imageId);
    galleries[activeCode] = galleries[activeCode].filter(function(i) { return i.id !== imageId; });
    renderApp();
  } catch (err) { alert('Gagal hapus: ' + err.message); }
}

// ── Advanced Zoom Lightbox ──
var lbState = { scale: 1, panX: 0, panY: 0, dragging: false, startX: 0, startY: 0, minScale: 0.5, maxScale: 20 };

function openLightbox(url, title) {
  var modal = document.getElementById('lightboxModal');
  var img = document.getElementById('lightboxImage');
  document.getElementById('lightboxTitle').innerText = title;
  document.getElementById('lbZoomLevel').innerText = '100%';
  img.src = url;
  lbState = { scale: 1, panX: 0, panY: 0, dragging: false, startX: 0, startY: 0, minScale: 0.5, maxScale: 20 };
  modal.classList.remove('hidden');
  img.onload = function() { lbApplyTransform(); };
}

function closeLightbox() {
  document.getElementById('lightboxModal').classList.add('hidden');
  document.getElementById('lightboxImage').src = '';
}

function lbApplyTransform() {
  var img = document.getElementById('lightboxImage');
  img.style.transform = 'translate(' + lbState.panX + 'px, ' + lbState.panY + 'px) scale(' + lbState.scale + ')';
  document.getElementById('lbZoomLevel').innerText = Math.round(lbState.scale * 100) + '%';
}

function lbZoomIn()  { lbSetScale(lbState.scale * 1.4); }
function lbZoomOut() { lbSetScale(lbState.scale / 1.4); }
function lbSetScale(newScale) {
  lbState.scale = Math.max(lbState.minScale, Math.min(lbState.maxScale, newScale));
  lbApplyTransform();
}
function lbResetZoom() {
  lbState.scale = 1; lbState.panX = 0; lbState.panY = 0;
  lbApplyTransform();
}
function lbFitScreen() {
  var img = document.getElementById('lightboxImage');
  var container = document.getElementById('lightboxContainer');
  var cw = container.clientWidth - 32, ch = container.clientHeight - 32;
  var iw = img.naturalWidth, ih = img.naturalHeight;
  if (!iw || !ih) return;
  var fitScale = Math.min(cw / iw, ch / ih, 1);
  lbState.scale = fitScale; lbState.panX = 0; lbState.panY = 0;
  lbApplyTransform();
}
function lbActualSize() {
  lbState.scale = 1; lbState.panX = 0; lbState.panY = 0;
  lbApplyTransform();
}

// Mouse wheel zoom
document.addEventListener('DOMContentLoaded', function() {
  var container = document.getElementById('lightboxContainer');
  if (!container) return;

  container.addEventListener('wheel', function(e) {
    e.preventDefault();
    var rect = container.getBoundingClientRect();
    var mouseX = e.clientX - rect.left - rect.width / 2;
    var mouseY = e.clientY - rect.top - rect.height / 2;
    var oldScale = lbState.scale;
    var factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    var newScale = Math.max(lbState.minScale, Math.min(lbState.maxScale, oldScale * factor));
    // Zoom toward cursor
    lbState.panX = mouseX - (mouseX - lbState.panX) * (newScale / oldScale);
    lbState.panY = mouseY - (mouseY - lbState.panY) * (newScale / oldScale);
    lbState.scale = newScale;
    lbApplyTransform();
  }, { passive: false });

  // Drag to pan
  container.addEventListener('mousedown', function(e) {
    if (e.button !== 0) return;
    lbState.dragging = true;
    lbState.startX = e.clientX - lbState.panX;
    lbState.startY = e.clientY - lbState.panY;
    container.style.cursor = 'grabbing';
    e.preventDefault();
  });
  window.addEventListener('mousemove', function(e) {
    if (!lbState.dragging) return;
    lbState.panX = e.clientX - lbState.startX;
    lbState.panY = e.clientY - lbState.startY;
    lbApplyTransform();
  });
  window.addEventListener('mouseup', function() {
    if (!lbState.dragging) return;
    lbState.dragging = false;
    var container = document.getElementById('lightboxContainer');
    if (container) container.style.cursor = 'grab';
  });

  // Touch: pinch to zoom + drag to pan
  var touchState = { dist: 0, panStartX: 0, panStartY: 0, initScale: 1, midX: 0, midY: 0 };
  container.addEventListener('touchstart', function(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      touchState.dist = Math.sqrt(dx * dx + dy * dy);
      touchState.initScale = lbState.scale;
      var rect = container.getBoundingClientRect();
      touchState.midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left - rect.width / 2;
      touchState.midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top - rect.height / 2;
    } else if (e.touches.length === 1) {
      lbState.dragging = true;
      lbState.startX = e.touches[0].clientX - lbState.panX;
      lbState.startY = e.touches[0].clientY - lbState.panY;
    }
  }, { passive: false });
  container.addEventListener('touchmove', function(e) {
    if (e.touches.length === 2 && touchState.dist) {
      e.preventDefault();
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var newDist = Math.sqrt(dx * dx + dy * dy);
      var newScale = Math.max(lbState.minScale, Math.min(lbState.maxScale, touchState.initScale * (newDist / touchState.dist)));
      lbState.panX = touchState.midX - (touchState.midX - lbState.panX) * (newScale / lbState.scale);
      lbState.panY = touchState.midY - (touchState.midY - lbState.panY) * (newScale / lbState.scale);
      lbState.scale = newScale;
      lbApplyTransform();
    } else if (e.touches.length === 1 && lbState.dragging) {
      lbState.panX = e.touches[0].clientX - lbState.startX;
      lbState.panY = e.touches[0].clientY - lbState.startY;
      lbApplyTransform();
    }
  }, { passive: false });
  container.addEventListener('touchend', function(e) {
    if (e.touches.length < 2) touchState.dist = 0;
    if (e.touches.length === 0) lbState.dragging = false;
  });

  // Double-click to toggle zoom
  container.addEventListener('dblclick', function(e) {
    e.preventDefault();
    if (lbState.scale > 1.05) {
      lbResetZoom();
    } else {
      var rect = container.getBoundingClientRect();
      var mouseX = e.clientX - rect.left - rect.width / 2;
      var mouseY = e.clientY - rect.top - rect.height / 2;
      var newScale = 3;
      lbState.panX = mouseX - (mouseX - lbState.panX) * (newScale / lbState.scale);
      lbState.panY = mouseY - (mouseY - lbState.panY) * (newScale / lbState.scale);
      lbState.scale = newScale;
      lbApplyTransform();
    }
  });
});

// Keyboard shortcuts in lightbox
document.addEventListener('keydown', function(e) {
  var modal = document.getElementById('lightboxModal');
  if (!modal || modal.classList.contains('hidden')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === '+' || e.key === '=') { e.preventDefault(); lbZoomIn(); }
  if (e.key === '-') { e.preventDefault(); lbZoomOut(); }
  if (e.key === '0') { e.preventDefault(); lbResetZoom(); }
});

async function initApp() {
  await loadData();
  renderApp();
}
initApp();

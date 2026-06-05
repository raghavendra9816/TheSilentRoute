// ============================================
// ADMIN UPLOAD PAGE JAVASCRIPT
// ============================================

if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
  window.location.href = '/login.html';
}

const user = Auth.getUser();
document.getElementById('adminName').textContent = user?.username || 'Admin';

let currentUploadType = 'image';
let selectedFile = null;

// Sidebar Toggle
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('adminSidebar').classList.toggle('open');
});
document.getElementById('sidebarClose')?.addEventListener('click', () => {
  document.getElementById('adminSidebar').classList.remove('open');
});

// ===== SET UPLOAD TYPE =====
function setUploadType(type) {
  currentUploadType = type;

  document.getElementById('imageTypeBtn').classList.toggle('active', type === 'image');
  document.getElementById('videoTypeBtn').classList.toggle('active', type === 'video');

  const fileInput = document.getElementById('fileInput');
  const dropHint = document.getElementById('dropHint');
  const dropIcon = document.getElementById('dropIcon');

  if (type === 'image') {
    fileInput.accept = 'image/*';
    dropHint.textContent = 'Supports: JPG, PNG, WEBP (Max 10MB)';
    dropIcon.className = 'fas fa-image';
  } else {
    fileInput.accept = 'video/*';
    dropHint.textContent = 'Supports: MP4, MOV, AVI, MKV (Max 500MB)';
    dropIcon.className = 'fas fa-video';
  }

  // Reset file selection
  selectedFile = null;
  fileInput.value = '';
  resetDropZone();
}

// ===== DRAG AND DROP =====
const dropZone = document.getElementById('dropZone');

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  if (files.length > 0) processFile(files[0]);
});

// ===== FILE SELECT =====
function handleFileSelect(input) {
  if (input.files && input.files[0]) {
    processFile(input.files[0]);
  }
}

function processFile(file) {
  selectedFile = file;
  const fileName = document.getElementById('fileName');
  const fileNameText = document.getElementById('fileNameText');
  const previewImg = document.getElementById('previewImg');
  const dropZoneContent = document.getElementById('dropZoneContent');

  fileNameText.textContent = `${file.name} (${formatFileSize(file.size)})`;
  fileName.style.display = 'flex';

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewImg.style.display = 'block';
      dropZoneContent.style.display = 'none';
    };
    reader.readAsDataURL(file);
  } else {
    previewImg.style.display = 'none';
    dropZoneContent.style.display = 'block';
    const dropIcon = document.getElementById('dropIcon');
    dropIcon.className = 'fas fa-check-circle';
    dropIcon.style.color = '#48bb78';
    document.querySelector('.drop-zone p').textContent = file.name;
    document.getElementById('dropHint').textContent = formatFileSize(file.size);
  }
}

function resetDropZone() {
  document.getElementById('previewImg').style.display = 'none';
  document.getElementById('dropZoneContent').style.display = 'block';
  document.getElementById('fileName').style.display = 'none';
  document.getElementById('dropIcon').className = 'fas fa-cloud-upload-alt';
  document.getElementById('dropIcon').style.color = '';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ===== UPLOAD FORM SUBMIT =====
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!selectedFile) {
    showToast('Please select a file to upload.', 'error');
    return;
  }

  const title = document.getElementById('mediaTitle').value.trim();
  if (!title) {
    showToast('Please enter a title.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('media', selectedFile);
  formData.append('title', title);
  formData.append('description', document.getElementById('mediaDescription').value.trim());
  formData.append('category', document.getElementById('mediaCategory').value);
  formData.append('tags', document.getElementById('mediaTags').value.trim());
  formData.append('location', document.getElementById('mediaLocation').value.trim());
  formData.append('isFeatured', document.getElementById('isFeatured').checked);

  const btn = document.getElementById('uploadBtn');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
  progressContainer.style.display = 'block';

  try {
    const token = Auth.getToken();
    const endpoint = `${CONFIG.API_URL}/admin/upload/${currentUploadType}`;

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        progressBar.style.width = percent + '%';
        progressText.textContent = percent + '%';
      }
    });

    xhr.addEventListener('load', () => {
      const response = JSON.parse(xhr.responseText);
      if (xhr.status === 201) {
        showToast('Media uploaded successfully! 🎉', 'success');
        resetForm();
        loadRecentUploads();
      } else {
        throw new Error(response.message || 'Upload failed');
      }
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-upload"></i> Upload Media';
      progressContainer.style.display = 'none';
    });

    xhr.addEventListener('error', () => {
      showToast('Upload failed. Please try again.', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-upload"></i> Upload Media';
      progressContainer.style.display = 'none';
    });

    xhr.open('POST', endpoint);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);

  } catch (error) {
    showToast(error.message || 'Upload failed.', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-upload"></i> Upload Media';
    progressContainer.style.display = 'none';
  }
});

function resetForm() {
  document.getElementById('uploadForm').reset();
  selectedFile = null;
  document.getElementById('fileInput').value = '';
  resetDropZone();
  progressBar.style.width = '0%';
}

// ===== LOAD RECENT UPLOADS =====
async function loadRecentUploads() {
  try {
    const response = await API.get('/admin/media?limit=5');
    const container = document.getElementById('recentUploads');

    if (!response.data || response.data.length === 0) {
      container.innerHTML = '<p style="color:var(--gray);text-align:center;padding:20px;">No uploads yet</p>';
      return;
    }

    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Preview</th>
            <th>Title</th>
            <th>Type</th>
            <th>Category</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${response.data.map(item => `
            <tr>
              <td>
                <img
                  src="${item.thumbnailUrl || 'https://via.placeholder.com/60x40/1a1a2e/fff?text=TSR'}"
                  style="width:60px;height:40px;object-fit:cover;border-radius:6px;"
                  alt="${item.title}"
                />
              </td>
              <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                ${item.title}
              </td>
              <td><span class="badge ${item.type}">${item.type}</span></td>
              <td>${item.category}</td>
              <td>${new Date(item.createdAt).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    document.getElementById('recentUploads').innerHTML =
      '<p style="color:var(--gray);padding:20px;">Failed to load recent uploads.</p>';
  }
}

loadRecentUploads();
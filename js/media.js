// ============================================================
// PULSE — Media (media.js)
// Image upload, compression, validation, base64 handling
// ============================================================

const Media = (() => {

  const MAX_SIZE_MB = 5;
  const MAX_WIDTH = 1200;
  const QUALITY = 0.82;

  // ── Validate file ────────────────────────────────────────

  function validateFile(file) {
    if (!file.type.startsWith('image/')) {
      return { ok: false, error: 'Only image files are supported.' };
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return { ok: false, error: `Image must be under ${MAX_SIZE_MB}MB.` };
    }
    return { ok: true };
  }

  // ── Compress + convert to base64 ─────────────────────────

  function compressImage(file, maxWidth = MAX_WIDTH, quality = QUALITY) {
    return new Promise((resolve, reject) => {
      const validation = validateFile(file);
      if (!validation.ok) {
        reject(new Error(validation.error));
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        };
        img.onerror = () => reject(new Error('Failed to load image.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  }

  // ── Handle multiple images ────────────────────────────────

  async function processImages(files) {
    const results = [];
    for (const file of files) {
      try {
        const base64 = await compressImage(file);
        results.push({ ok: true, data: base64 });
      } catch (e) {
        results.push({ ok: false, error: e.message });
      }
    }
    return results;
  }

  // ── Create image preview ──────────────────────────────────

  function createPreview(src, onRemove) {
    const wrapper = document.createElement('div');
    wrapper.className = 'media-preview-item';
    wrapper.innerHTML = `
      <img src="${src}" alt="Preview">
      <button class="media-preview-remove" type="button" aria-label="Remove image">✕</button>
    `;
    wrapper.querySelector('.media-preview-remove').addEventListener('click', () => {
      wrapper.classList.add('removing');
      setTimeout(() => {
        wrapper.remove();
        if (onRemove) onRemove();
      }, 250);
    });
    return wrapper;
  }

  // ── File input handler ────────────────────────────────────

  function setupImageInput(inputEl, previewContainer, maxFiles = 4, onUpdate) {
    const images = [];

    inputEl.addEventListener('change', async () => {
      const files = [...inputEl.files].slice(0, maxFiles - images.length);
      if (!files.length) return;

      for (const file of files) {
        if (images.length >= maxFiles) {
          Utils.showToast(`Maximum ${maxFiles} images allowed.`, 'warning');
          break;
        }
        try {
          const base64 = await compressImage(file);
          images.push(base64);
          const preview = createPreview(base64, () => {
            const idx = images.indexOf(base64);
            if (idx > -1) images.splice(idx, 1);
            if (onUpdate) onUpdate([...images]);
          });
          previewContainer.appendChild(preview);
          if (onUpdate) onUpdate([...images]);
        } catch (e) {
          Utils.showToast(e.message, 'error');
        }
      }
      // Reset input so same file can be re-selected
      inputEl.value = '';
    });

    return { getImages: () => [...images], clear: () => { images.length = 0; previewContainer.innerHTML = ''; } };
  }

  // ── Avatar upload ─────────────────────────────────────────

  function setupAvatarUpload(inputEl, displayEl, onUpload) {
    inputEl.addEventListener('change', async () => {
      const file = inputEl.files[0];
      if (!file) return;
      try {
        const base64 = await compressImage(file, 400, 0.88);
        displayEl.innerHTML = `<img src="${base64}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        if (onUpload) onUpload(base64);
      } catch (e) {
        Utils.showToast(e.message, 'error');
      }
    });
  }

  return { validateFile, compressImage, processImages, createPreview, setupImageInput, setupAvatarUpload };
})();

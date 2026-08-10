// <photo-slot> — drag & drop image placeholder, persisted in localStorage.
// Attributes: id (persistence key, required to persist), shape ('circle'|'rounded'|'rect',
// default 'rounded'), placeholder (empty-state caption).
(() => {
  const PREFIX = 'photo-slot:';
  const MAX_DIM = 480;
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  async function toDataUrl(file) {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  const stylesheet = `
    :host{display:block;position:relative;width:100%;height:100%;
      font:11px/1.3 'IBM Plex Mono',monospace;color:inherit}
    .frame{position:absolute;inset:0;overflow:hidden;background:rgba(228,168,77,.08);cursor:pointer}
    .frame img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none}
    .ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed currentColor;opacity:.4}
    :host([data-filled]) .ring{opacity:0}
    .empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
      text-align:center;padding:6px;text-transform:uppercase;letter-spacing:.1em;opacity:.65}
    :host([data-filled]) .empty{display:none}
    :host([data-over]) .frame{outline:2px solid var(--gold,#E4A84D);outline-offset:-2px;background:rgba(228,168,77,.18)}
    input{display:none}
  `;

  class PhotoSlot extends HTMLElement {
    static get observedAttributes() { return ['shape', 'placeholder']; }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${stylesheet}</style>
        <div class="frame" part="frame">
          <img part="image" alt="">
          <div class="empty" part="empty"></div>
          <div class="ring" part="ring"></div>
        </div>
        <input type="file" accept="${ACCEPT.join(',')}">`;
      this._frame = root.querySelector('.frame');
      this._img = root.querySelector('img');
      this._empty = root.querySelector('.empty');
      this._input = root.querySelector('input');
      this._depth = 0;
      this._frame.addEventListener('click', () => this._input.click());
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt =>
        this.addEventListener(evt, this));
    }

    connectedCallback() {
      this._applyShape();
      this._empty.textContent = this.getAttribute('placeholder') || 'Drop an image';
      const key = this._key();
      if (key) {
        const saved = localStorage.getItem(key);
        if (saved) this._show(saved);
      }
    }

    attributeChangedCallback() { this._applyShape(); }

    _key() {
      return this.id ? PREFIX + this.id : null;
    }

    _applyShape() {
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      this._frame.style.borderRadius =
        shape === 'circle' ? '50%' : shape === 'rect' ? '0' : '12px';
      this._frame.style.borderRadius && (this.shadowRoot.querySelector('.ring').style.borderRadius = this._frame.style.borderRadius);
    }

    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        if (--this._depth <= 0) { this._depth = 0; this.removeAttribute('data-over'); }
      } else if (e.type === 'drop') {
        e.preventDefault();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }

    async _ingest(file) {
      if (!file || ACCEPT.indexOf(file.type) < 0) return;
      try {
        const url = await toDataUrl(file);
        this._show(url);
        const key = this._key();
        if (key) {
          try { localStorage.setItem(key, url); } catch (e) { /* quota exceeded: keep in-memory only */ }
        }
      } catch (e) { /* unreadable file: leave slot empty */ }
    }

    _show(url) {
      this._img.src = url;
      this._img.style.display = 'block';
      this.toggleAttribute('data-filled', true);
    }
  }

  if (!customElements.get('photo-slot')) {
    customElements.define('photo-slot', PhotoSlot);
  }
})();

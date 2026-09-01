import {
  JiwoWebGLRenderer,
  RenderMode,
  RenderModel,
  isWebGLSupported,
  render2DFallbackCanvas,
} from '@jiwoqr/renderer-webgl';
import { encodeQR } from '@jiwoqr/core';

export class JiwoQRElement extends HTMLElement {
  private renderer?: JiwoWebGLRenderer;
  private fallbackCanvas?: HTMLCanvasElement;
  private isFallback = false;

  static get observedAttributes() {
    return ['value', 'model', 'mode'];
  }

  connectedCallback() {
    this.style.display = 'block';
    this.style.width = this.style.width || '100%';
    this.style.height = this.style.height || '100%';
    this.style.position = 'relative';

    const value = this.getAttribute('value') || 'https://jiwoqr.dev';
    const model = (this.getAttribute('model') as RenderModel) || 'architecture';
    const mode = (this.getAttribute('mode') as RenderMode) || '3d';

    if (isWebGLSupported()) {
      try {
        this.renderer = new JiwoWebGLRenderer({
          container: this,
          model,
          mode,
        });
        this.renderer.setData(value);
        this.isFallback = false;
        return;
      } catch (err) {
        console.warn('[JiwoQRElement] WebGL initialization failed. Falling back to 2D canvas.', err);
        this.isFallback = true;
      }
    } else {
      this.isFallback = true;
    }

    if (this.isFallback) {
      this.innerHTML = '';
      const canvas = document.createElement('canvas');
      canvas.width = this.clientWidth || 300;
      canvas.height = this.clientHeight || 300;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.objectFit = 'contain';
      this.appendChild(canvas);
      this.fallbackCanvas = canvas;
      this.renderFallback(value);
    }
  }

  private renderFallback(val: string) {
    if (!this.fallbackCanvas) return;
    try {
      const matrix = encodeQR(val);
      render2DFallbackCanvas(this.fallbackCanvas, matrix);
    } catch {
      // Ignore invalid input during typing
    }
  }

  disconnectedCallback() {
    this.renderer?.dispose();
    this.renderer = undefined;
    this.fallbackCanvas?.remove();
    this.fallbackCanvas = undefined;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    if (this.renderer) {
      if (name === 'value') {
        this.renderer.setData(newValue);
      } else if (name === 'mode') {
        this.renderer.setMode(newValue as RenderMode);
      } else if (name === 'model') {
        this.renderer.setModel(newValue as RenderModel);
      }
    } else if (this.isFallback && name === 'value') {
      this.renderFallback(newValue);
    }
  }

  public setMode(mode: RenderMode) {
    this.setAttribute('mode', mode);
    this.renderer?.setMode(mode);
  }

  public setModel(model: RenderModel) {
    this.setAttribute('model', model);
    this.renderer?.setModel(model);
  }

  public setMorphProgress(progress: number) {
    this.renderer?.setMorphProgress(progress);
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('jiwo-qr')) {
  customElements.define('jiwo-qr', JiwoQRElement);
}


import { JiwoWebGLRenderer, RenderMode, RenderModel } from '@jiwoqr/renderer-webgl';

export class JiwoQRElement extends HTMLElement {
  private renderer?: JiwoWebGLRenderer;

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

    this.renderer = new JiwoWebGLRenderer({
      container: this,
      model,
      mode,
    });
    this.renderer.setData(value);
  }

  disconnectedCallback() {
    this.renderer?.dispose();
    this.renderer = undefined;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue || !this.renderer) return;

    if (name === 'value') {
      this.renderer.setData(newValue);
    } else if (name === 'mode') {
      this.renderer.setMode(newValue as RenderMode);
    } else if (name === 'model') {
      this.renderer.setModel(newValue as RenderModel);
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

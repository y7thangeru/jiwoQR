import React, { useEffect, useRef } from 'react';
import {
  JiwoWebGLRenderer,
  RenderMode,
  RenderModel,
  isWebGLSupported,
  render2DFallbackCanvas,
} from '@jiwoqr/renderer-webgl';
import { encodeQR } from '@jiwoqr/core';

export interface JiwoQRProps {
  /** Target URL or data to encode */
  value: string;
  /** Visual 3D model archetype */
  model?: RenderModel;
  /** Display mode ('3d' interactive world or 'scan' flat 2D) */
  mode?: RenderMode;
  /** Width / height styling */
  className?: string;
  style?: React.CSSProperties;
  /** Transition morph duration in ms (default 800) */
  morphDuration?: number;
}

export const JiwoQR: React.FC<JiwoQRProps> = ({
  value,
  model = 'architecture',
  mode = '3d',
  className,
  style,
  morphDuration = 800,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<JiwoWebGLRenderer | null>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isFallbackRef = useRef<boolean>(false);

  useEffect(() => {
    if (!containerRef.current) return;

    if (isWebGLSupported()) {
      try {
        const renderer = new JiwoWebGLRenderer({
          container: containerRef.current,
          model,
          mode,
          morphDuration,
        });
        rendererRef.current = renderer;
        renderer.setData(value);
        isFallbackRef.current = false;

        return () => {
          renderer.dispose();
          rendererRef.current = null;
        };
      } catch (err) {
        console.warn('[JiwoQR] WebGL initialization failed. Falling back to 2D canvas.', err);
        isFallbackRef.current = true;
      }
    } else {
      isFallbackRef.current = true;
    }

    // Zero-WebGL Fallback branch
    if (isFallbackRef.current && containerRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = containerRef.current.clientWidth || 300;
      canvas.height = containerRef.current.clientHeight || 300;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.objectFit = 'contain';

      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(canvas);
      fallbackCanvasRef.current = canvas;

      try {
        const matrix = encodeQR(value);
        render2DFallbackCanvas(canvas, matrix);
      } catch {
        // Ignore encoding error if payload is empty/invalid
      }

      return () => {
        canvas.remove();
        fallbackCanvasRef.current = null;
      };
    }
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setData(value);
    } else if (isFallbackRef.current && fallbackCanvasRef.current) {
      try {
        const matrix = encodeQR(value);
        render2DFallbackCanvas(fallbackCanvasRef.current, matrix);
      } catch {
        // Ignore encoding error
      }
    }
  }, [value]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setMode(mode);
    }
  }, [mode]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setModel(model);
    }
  }, [model]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    />
  );
};


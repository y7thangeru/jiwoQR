import React, { useEffect, useRef } from 'react';
import { JiwoWebGLRenderer, RenderMode, RenderModel } from '@jiwoqr/renderer-webgl';

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

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new JiwoWebGLRenderer({
      container: containerRef.current,
      model,
      mode,
      morphDuration,
    });
    rendererRef.current = renderer;
    renderer.setData(value);

    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setData(value);
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

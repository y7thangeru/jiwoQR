import { defineConfig, Plugin } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stlDirectory = path.resolve(__dirname, '../../STL-for-buildingModels');

function buildingModelsPlugin(): Plugin {
  return {
    name: 'vite-plugin-building-models',
    configureServer(server) {
      // 1. API endpoint to list all available STL models dynamically
      server.middlewares.use('/api/building-models', (_req, res) => {
        try {
          if (!fs.existsSync(stlDirectory)) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ models: [], count: 0 }));
            return;
          }
          const files = fs.readdirSync(stlDirectory)
            .filter((f) => f.toLowerCase().endsWith('.stl') && !f.startsWith('_'))
            .map((f) => `/models/stl/${encodeURIComponent(f)}`);

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ models: files, count: files.length }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

      // 2. Serve STL static files from STL-for-buildingModels directory
      server.middlewares.use('/models/stl/', (req, res, next) => {
        try {
          const rawFileName = req.url ? decodeURIComponent(req.url.replace(/^\//, '')) : '';
          const filePath = path.join(stlDirectory, rawFileName);

          if (rawFileName && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'application/sla');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
          } else {
            next();
          }
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig({
  cacheDir: path.resolve(process.env.TEMP || 'C:/temp', 'jiwoqr-vite-cache'),
  plugins: [buildingModelsPlugin()],
  resolve: {
    alias: {
      '@jiwoqr/core': path.resolve(__dirname, '../../packages/core/src'),
      '@jiwoqr/math': path.resolve(__dirname, '../../packages/math/src'),
      '@jiwoqr/renderer-webgl': path.resolve(__dirname, '../../packages/renderer-webgl/src'),
      '@jiwoqr/exporter': path.resolve(__dirname, '../../packages/exporter/src'),
      '@jiwoqr/react': path.resolve(__dirname, '../../packages/react/src'),
    },
  },
  optimizeDeps: {
    noDiscovery: true,
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      allow: ['../..'],
    },
  },
});


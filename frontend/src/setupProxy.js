const { createProxyMiddleware } = require('http-proxy-middleware');

const handleProxyError = (err, req, res) => {
  if (res && typeof res.writeHead === 'function' && !res.headersSent) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 503,
        error: 'Service Unavailable',
        message: 'El servidor backend se está iniciando o reiniciando temporalmente.',
      })
    );
  }
};

module.exports = function setupProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      onError: handleProxyError,
    })
  );
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      ws: true,
      changeOrigin: true,
      onError: handleProxyError,
    })
  );
};

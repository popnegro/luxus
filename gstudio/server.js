require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Body parsing middlewares for handling contact form submissions
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Secure API endpoint to proxy form submissions to Formspree
app.post('/api/contact', async (req, res) => {
  try {
    const formspreeId = process.env.LUXUS_FORMSPREE_ID;
    if (!formspreeId) {
      console.error('Error: LUXUS_FORMSPREE_ID environment variable is missing.');
      return res.status(500).json({ error: 'La configuración del formulario no está completa. Falta el identificador del destinatario.' });
    }

    // Forward the payload to Formspree using Node global fetch API
    const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Formspree returned error status:', response.status, data);
      return res.status(response.status).json({ error: data.error || 'Ocurrió un error al procesar el envío.' });
    }

    return res.status(200).json({ success: true, message: 'Consulta recibida correctamente.' });
  } catch (error) {
    console.error('Error in secure /api/contact proxy:', error);
    return res.status(500).json({ error: 'No se pudo enviar la consulta. Por favor, inténtelo de nuevo más tarde.' });
  }
});

// Log environment status
console.log('Starting Luxus App dev server with config:');
console.log(`- Project ID: ${process.env.LUXUS_SANITY_PROJECT_ID || 'default'}`);
console.log(`- Dataset: ${process.env.LUXUS_SANITY_DATASET || 'default'}`);

function injectEnvConfig(htmlContent) {
  const envConfig = {
    contactEmail: process.env.LUXUS_CONTACT_EMAIL_B64 || "",
    formId: process.env.LUXUS_FORMSPREE_ID || "",
    gaId: process.env.LUXUS_GA_ID || "",
    sanity: {
      projectId: process.env.LUXUS_SANITY_PROJECT_ID || "",
      dataset: process.env.LUXUS_SANITY_DATASET || ""
    }
  };

  const scriptToInject = `
  <!-- AI Studio Dynamic Environment Configuration -->
  <script>
    window.LUXUS_ENV_CONFIG = ${JSON.stringify(envConfig)};
    Object.defineProperty(window, 'LUXUS_CONFIG', {
      configurable: true,
      enumerable: true,
      get() {
        return this._LUXUS_CONFIG;
      },
      set(val) {
        this._LUXUS_CONFIG = val;
        if (val && window.LUXUS_ENV_CONFIG) {
          if (window.LUXUS_ENV_CONFIG.contactEmail) val.contactEmail = window.LUXUS_ENV_CONFIG.contactEmail;
          if (window.LUXUS_ENV_CONFIG.formId) val.formId = window.LUXUS_ENV_CONFIG.formId;
          if (window.LUXUS_ENV_CONFIG.gaId) val.gaId = window.LUXUS_ENV_CONFIG.gaId;
          if (window.LUXUS_ENV_CONFIG.sanity) {
            if (window.LUXUS_ENV_CONFIG.sanity.projectId) val.sanity.projectId = window.LUXUS_ENV_CONFIG.sanity.projectId;
            if (window.LUXUS_ENV_CONFIG.sanity.dataset) val.sanity.dataset = window.LUXUS_ENV_CONFIG.sanity.dataset;
          }
        }
      }
    });
  </script>
  `;

  return htmlContent.replace('</head>', `${scriptToInject}\n</head>`);
}

// Map root-relative URLs used by Sanity Studio
app.use('/static', express.static(path.join(__dirname, 'studio-luxus-blog', 'static')));
app.use('/vendor', express.static(path.join(__dirname, 'studio-luxus-blog', 'vendor')));

// Serve the Sanity Studio pre-built dashboard
app.get(/^\/studio-luxus-blog/, (req, res) => {
  const indexFile = path.join(__dirname, 'studio-luxus-blog', 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send('Sanity Studio index.html not found');
  }
});

// Serve assets directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Helper to serve HTML pages with environment injection
const serveHtmlPage = (pageName, res) => {
  const filePath = path.join(__dirname, pageName);
  if (fs.existsSync(filePath)) {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.status(500).send('Error reading page template');
        return;
      }
      res.send(injectEnvConfig(data));
    });
  } else {
    res.status(404).send('Page not found');
  }
};

// HTML routes (both explicit and extensionless)
const htmlPages = [
  'index',
  'contacto',
  'blog',
  'metodologia',
  'nosotros',
  'servicios',
  'post'
];

app.get('/', (req, res) => {
  serveHtmlPage('index.html', res);
});

htmlPages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    serveHtmlPage(`${page}.html`, res);
  });
  app.get(`/${page}.html`, (req, res) => {
    serveHtmlPage(`${page}.html`, res);
  });
});

// Serve static files in the root folder (excluding index.html etc.)
app.use(express.static(__dirname, {
  index: false,
  extensions: ['txt', 'xml', 'pdf', 'png', 'svg', 'webp', 'ico']
}));

// Fallback 404 handler
app.use((req, res) => {
  const errorPage = path.join(__dirname, '404.html');
  if (fs.existsSync(errorPage)) {
    res.status(404).sendFile(errorPage);
  } else {
    res.status(404).send('Page not found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Luxus application running on http://0.0.0.0:${PORT}`);
});

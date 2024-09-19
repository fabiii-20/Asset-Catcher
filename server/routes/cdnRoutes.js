const express = require('express');
const router = express.Router();
const cdnController = require('../controllers/cdnController');

// Route to download assets
router.post('/download-assets', cdnController.downloadAssets);

// Route to generate and download Excel
router.post('/download-excel', cdnController.downloadExcel);

module.exports = router;

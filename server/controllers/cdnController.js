const fs = require('fs');
const path = require('path');
const axios = require('axios');
const XLSX = require('xlsx');

// Helper function to extract extension
const extractExtension = (filePath) => {
  const segments = filePath.split('/');
  const lastSegment = segments.pop(); // Get last segment after last slash
  const extension = lastSegment.toLowerCase();
  return extension; // Assuming the last segment is the extension
};

// Download assets for each RT ID
const downloadAssets = async (req, res) => {
  try {
    const { rtData } = req.body;
    if (!rtData || !Array.isArray(rtData)) {
      return res.status(400).send('Invalid data provided.');
    }

    console.log('Received rtData:', rtData);
    for (const rt of rtData) {
      console.log('Processing RT:', rt);
      const url = `https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/${rt.id}`;
      console.log('Generated URL:', url, 'RT ID:', rt.id);

      // Extract extension from path
      const fileExtension = extractExtension(rt.path);
      const filePath = path.join(__dirname, 'downloads', `${rt.name}.${fileExtension}`);
      console.log(filePath);

      // Ensure the download folder exists
      if (!fs.existsSync(path.join(__dirname, 'downloads'))) {
        console.log("Creating downloads folder");
        fs.mkdirSync(path.join(__dirname, 'downloads'));
      }

      const writer = fs.createWriteStream(filePath);
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
      });

      response.data.pipe(writer);

      // Wait until the file is fully written
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    }

    res.send('Assets successfully downloaded!');
  } catch (err) {
    console.error('Error downloading assets:', err);
    res.status(500).send('Server error during asset download.');
  }
};

module.exports = {
  downloadAssets,
};


// Generate Excel with created URLs
// Generate Excel with created URLs
const downloadExcel = (req, res) => {
    try {
      const { rtData } = req.body;
      if (!rtData || !Array.isArray(rtData)) {
        return res.status(400).send('Invalid data provided.');
      }
  
      const data = rtData.map(rt => {
        const downloadable = rt.forceUserDownload;
        const fileExtension = extractExtension(rt.path); // Extract the file extension from path
        let url;
  
        if (fileExtension === 'pdf') {
          // For PDFs, use the existing logic
          const basePath = downloadable
            ? 'https://www.microsoft.com/content/dam/'
            : 'https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/';
          url = `${basePath}${rt.path}/${rt.name}.pdf`;
        } else if (['xlsx', 'docx', 'pptx', 'zip'].includes(fileExtension)) {
          // For other document types, use the CDN URL format
          url = `https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/${rt.path}/${rt.name}`;
        } else {
          console.log(`Unsupported file extension: ${fileExtension}`);
          return null; // Skip unsupported file types
        }
  
        return {
          RT_ID: rt.id,
          Downloadable: downloadable ? 'Yes' : 'No',
          URL: url,
        };
      }).filter(item => item !== null); // Filter out null values for unsupported file types
  
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'RT Data');
  
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=rt_data.xlsx');
      res.send(excelBuffer);
    } catch (err) {
      console.error('Error generating Excel:', err);
      res.status(500).send('Server error during Excel generation.');
    }
  };
  
  module.exports = {
    downloadExcel,
  };

module.exports = {
  downloadAssets,
  downloadExcel,
};

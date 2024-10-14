const fs = require('fs');
const path = require('path');
const axios = require('axios');
const XLSX = require('xlsx');

// Helper function to extract extension
const extractExtension = (filePath) => {
  const extensions = ['pdf', 'docx', 'pptx', 'zip'];
  
  // Check if any of the extensions are present in the filePath
  for (const extension of extensions) {
    if (filePath.toLowerCase().includes(extension)) {
      return extension;
    }
  }
  
  // If none of the extensions are found
  return null;
};

// Helper function to sanitize file names
const sanitizeFileName = (fileName) => {
     // Extract the extension (if any) and the base name
  const extensionMatch = fileName.match(/\.[^/.]+$/);
  const extension = extensionMatch ? extensionMatch[0] : '';
  const baseName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension from base name
    // Remove transition words, replace underscores, remove special characters, trim length, etc.
    const sanitized = baseName
      .replace(/\b(the|and)\b/gi, '')             // Remove 'the' and 'and'
      .replace(/_/g, '-')                         // Replace underscores with hyphens
      .replace(/[^\w-]+/g, '-')                   // Replace special characters with hyphens
      .replace(/-+/g, '-')                        // Replace multiple hyphens with a single hyphen
      .replace(/^-/, '')                          // Remove leading hyphen if present
      .trim();                                    // Trim any leading/trailing whitespace
  
    // Trim to 50 characters if the file name is too long
    return sanitized;
  };
  
  // Download assets for each RT ID
  const downloadAssets = async (req, res) => {
    try {
      const { rtData } = req.body; // Accept manualFileName input
      if (!rtData || !Array.isArray(rtData)) {
        return res.status(400).send('Invalid data provided.');
      }

      const longFileNames = []; // Array to hold long filenames
      console.log('Received rtData:', rtData);

      for (const rt of rtData) {
        console.log('Processing RT:', rt);
        const metadataUrl = `https://query.prod.cms.rt.microsoft.com/cms/api/am/fileData/${rt.id}`;

        // Fetch the file metadata if no manual filename is provided
        let fileName;
        if (rt.manualFileName) {
          fileName = rt.manualFileName;
          const metadataResponse = await axios.get(metadataUrl);
          fileExtension = (metadataResponse.data._name.split('.').pop() || '').toLowerCase();
          console.log('using manual file name',rt.manualFileName)
        } else {
          const metadataResponse = await axios.get(metadataUrl);
          fileName = metadataResponse.data._name; // Get the file name from metadata
          fileExtension = (fileName.split('.').pop() || '').toLowerCase();
        }

        const binaryUrl = `https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/${rt.id}`; // Binary download link

        console.log(`File name for RT ID ${rt.id}:`, fileName);
        if (!fileName) {
          console.error(`File name is missing for RT ID: ${rt.id}`);
          continue; // Skip this RT ID if fileName is not found
        }

        // Check if filename exceeds 50 characters
        // if (fileName.length > 50) {
        //   longFileNames.push({ RT_ID: rt.id, FileName: fileName }); // Add to long filenames list
        //   console.log(`Skipping download for RT ID ${rt.id} as the file name exceeds 50 characters.`);
        //   continue; // Skip the download if the filename exceeds 50 characters
        // }

        const sanitizedFileName = sanitizeFileName(fileName);
        const extension = fileExtension;
        const filePath = path.join(__dirname, 'downloads', `${sanitizedFileName}.${extension}`);
        console.log(filePath);

        // Ensure the download folder exists
        if (!fs.existsSync(path.join(__dirname, 'downloads'))) {
          console.log("Creating downloads folder");
          fs.mkdirSync(path.join(__dirname, 'downloads'));
        }

        // Download the binary file
        const fileResponse = await axios({
          url: binaryUrl,
          method: 'GET',
          responseType: 'stream',
        });

        const writer = fs.createWriteStream(filePath);
        fileResponse.data.pipe(writer);

        // Wait until the file is fully written
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
      }

      // Alert if there are any long filenames
      if (longFileNames.length > 0) {
        const alertMessage = longFileNames.map(item => `RT ID: ${item.RT_ID}, Filename: ${item.FileName}`).join('\n');
        console.log(`Alert: The following filenames exceed 50 characters:\n${alertMessage}`);
        // Optionally, you could send this information back to the client
        // res.status(400).send(`The following filenames exceed 50 characters:\n${alertMessage}`);
      }

      res.send('Assets successfully downloaded!');
    } catch (err) {
      console.error('Error downloading assets:', err);
      res.status(500).send('Server error during asset download.');
    }
};

  
  // Similar changes for downloadExcel if needed
  const downloadExcel = async (req, res) => {
    try {
      const { rtData } = req.body;
      if (!rtData || !Array.isArray(rtData)) {
        return res.status(400).send('Invalid data provided.');
      }
  
      const longFileNames = []; // Array to hold long filenames
      const data = await Promise.all(rtData.map(async (rt) => {
        const downloadable = rt.forceUserDownload;
        const metadataUrl = `https://query.prod.cms.rt.microsoft.com/cms/api/am/fileData/${rt.id}`;
        let fileName, fileExtension;
  
        try {
          const metadataResponse = await axios.get(metadataUrl);
          fileName = metadataResponse.data.fileName; // Get the fileName
          fileExtension = path.extname(metadataResponse.data._name) || ''; // Get the file extension
        } catch (error) {
          console.error(`Error fetching metadata for RT ID ${rt.id}:`, error);
          return null; // Skip if metadata fetch fails
        }
  
        // Check if filename exceeds 50 characters
        if (fileName.length > 50) {
          longFileNames.push({ RT_ID: rt.id, FileName: fileName });
        }
  
        const sanitizedFileName = sanitizeFileName(fileName);
        let url;
  
        if (fileExtension === '.pdf') {
          const basePath = downloadable
            ? 'https://www.microsoft.com/content/dam/'
            : 'https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/';
          url = `${basePath}${rt.path}/${sanitizedFileName}.pdf`;
        } else if (['.xlsx', '.docx', '.pptx', '.zip'].includes(fileExtension)) {
          url = `https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/${rt.path}/${sanitizedFileName}`;
        } else {
          console.log(`Unsupported file extension: ${fileExtension}`);
          return null; // Skip unsupported file types
        }
  
        return {
          RT_ID: rt.id,
          Downloadable: downloadable ? 'Yes' : 'No',
          URL: url,
        };
      }));
  
      const filteredData = data.filter(item => item !== null);
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'RT Data');
  
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
      // Alert if there are any long filenames
      if (longFileNames.length > 0) {
        const alertMessage = longFileNames.map(item => `RT ID: ${item.RT_ID}, Filename: ${item.FileName}`).join('\n');
        console.log(`Alert: The following filenames exceed 50 characters:\n${alertMessage}`);
        // res.status(400).send(`The following filenames exceed 50 characters:\n${alertMessage}`);
      }
  
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=rt_data.xlsx');
      res.send(excelBuffer);
    } catch (err) {
      console.error('Error generating Excel:', err);
      res.status(500).send('Server error during Excel generation.');
    }
  };

// Function to generate preview data
const generatePreview = async (req, res) => {
  try {
    const { rtData } = req.body;
    if (!rtData || !Array.isArray(rtData)) {
      return res.status(400).send('Invalid data provided.');
    }

    const longFileNames = []; // Array to hold long filenames
    const data = await Promise.all(rtData.map(async (rt) => {
      //const downloadable = rt.forceUserDownload; // Assuming this field is available
      const metadataUrl = `https://query.prod.cms.rt.microsoft.com/cms/api/am/fileData/${rt.id}`;
      let fileName, fileExtension, forceUserDownload;

      // Use manualFileName if provided, otherwise fetch from metadata
      if (rt.manualFileName) {
        fileName = rt.manualFileName;
        //fileExtension = ".pdf";
        const metadataResponse = await axios.get(metadataUrl);
        forceUserDownload = metadataResponse.data.forceUserDownload || false; 
      } else {
        try {
          const metadataResponse = await axios.get(metadataUrl);
          fileName = metadataResponse.data._name; // Get the file name from metadata
          fileExtension =  `.${fileName.split('.').pop().toLowerCase()}` // Get the file extension
          //console.log('the extension from meta data is', fileExtension, fileName)
          forceUserDownload = metadataResponse.data.forceUserDownload || false; // Extract forceUserDownload
          console.log(forceUserDownload)
        } catch (error) {
          console.error(`Error fetching metadata for RT ID ${rt.id}:`, error);
          return null; // Skip if metadata fetch fails
        }
      }

      const downloadable = forceUserDownload;
      const sanitizedFileName = sanitizeFileName(fileName);
      let url;

      // Check if filename exceeds 50 characters
      if (sanitizedFileName.length > 50) {
        longFileNames.push({ RT_ID: rt.id, Ext: fileExtension, FileName: sanitizedFileName });
      }

      // Generate URL based on file extension
      if (fileExtension === '.pdf') {
       const basePath = downloadable
          ? 'https://www.microsoft.com/content/dam/'
          : 'https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/';
        url = `${basePath}${rt.path}/${sanitizedFileName}.pdf`;
      } else if (['.xlsx','.docx', '.pptx', '.zip', '.ppsm'].includes(fileExtension)) {
        url = `https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/${sanitizedFileName}`;
      } else {
        console.log(`Unsupported file extension: ${fileExtension}`);
        return null; // Skip unsupported file types
      }

      return {
        RT_ID: rt.id,
        Downloadable: downloadable ? 'Yes' : 'No',
        URL: url,
      };
    }));

    const filteredData = data.filter(item => item !== null);

    // Alert if there are any long filenames
    if (longFileNames.length > 0) {
      const alertMessage = longFileNames.map(item => `RT ID: ${item.RT_ID}, Filetype: ${item.Ext}, Filename: ${item.FileName}`).join('\n');
      console.log(`Alert: The following filenames exceed 50 characters:\n${alertMessage}`);
      // Optionally, send this information back to the client
      // res.status(400).send(`The following filenames exceed 50 characters:\n${alertMessage}`);
    }

    res.status(200).json(filteredData); // Return the processed data
  } catch (error) {
    console.error('Error generating preview data:', error);
    res.status(500).send('Server error during preview generation.');
  }
};

  

module.exports = {
  generatePreview,
  downloadAssets,
  downloadExcel,
};

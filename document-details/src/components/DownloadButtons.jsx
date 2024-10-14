import React, { useState } from 'react';
import axios from 'axios';

const DownloadButtons = ({ rtData }) => {
  const [previewData, setPreviewData] = useState([]); // State to store preview data
  const [showPreview, setShowPreview] = useState(false); // State to toggle preview visibility

  // Function to handle the preview
  const handlePreview = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/generate-preview', { rtData });
      setPreviewData(response.data); // Store the preview data
      setShowPreview(true); // Show the preview
    } catch (error) {
      console.error('Error fetching preview data:', error);
    }
  };

  // Function to download assets (as you already have)
  const downloadAssets = async () => {
    try {
      await axios.post('http://localhost:3000/api/download-assets', { rtData });
      alert('Assets downloaded!');
    } catch (err) {
      console.error('Error downloading assets', err);
    }
  };

  // Function to download Excel (as you already have)
  const downloadExcel = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/download-excel', { rtData }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'URL_List.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error('Error downloading Excel', err);
    }
  };

  return (
    <div>
      <button onClick={downloadAssets}>Download Assets</button>
      <button onClick={downloadExcel}>Download URL List</button>
      <button onClick={handlePreview}>Preview URL List</button>

      {/* Display the preview data in a table */}
      {showPreview && (
        <div>
          <h3>Preview Data:</h3>
          <table border="1">
            <thead>
              <tr>
                <th>RT ID</th>
                <th>Downloadable</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((item, index) => (
                <tr key={index}>
                  <td>{item.RT_ID}</td>
                  <td>{item.Downloadable}</td>
                  <td><a href={item.URL} target="_blank" rel="noopener noreferrer">{item.URL}</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DownloadButtons;

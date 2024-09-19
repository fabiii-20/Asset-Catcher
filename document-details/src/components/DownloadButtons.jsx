import React from 'react';
import axios from 'axios';

const DownloadButtons = ({ rtData }) => {
  const downloadAssets = async () => {
    try {
      await axios.post('http://localhost:3000/api/download-assets', { rtData });
      alert('Assets downloaded!');
    } catch (err) {
      console.error('Error downloading assets', err);
    }
  };

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
      <button onClick={downloadExcel}>Download Excel</button>
    </div>
  );
};

export default DownloadButtons;

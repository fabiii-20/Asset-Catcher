import React, { useState } from 'react';
import Form from './components/Form';
import DownloadButtons from './components/DownloadButtons';

function App() {
  const [rtData, setRtData] = useState(null);

  const handleSubmit = (data) => {
    setRtData(data);
  };

  return (
    <div className="App">
      <h1>Asset Downloader</h1>
      <Form onSubmit={handleSubmit} />
      {rtData && <DownloadButtons rtData={rtData} />}
    </div>
  );
}

export default App;

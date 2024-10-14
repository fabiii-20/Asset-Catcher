import React, { useState } from 'react';

const Form = ({ onSubmit }) => {
  const [rtIdsInput, setRtIdsInput] = useState(''); // RT IDs input
  const [manualFileNamesInput, setManualFileNamesInput] = useState(''); // Manual filenames input
  const [useSamePath, setUseSamePath] = useState(false); // Checkbox state for same path
  const [commonPath, setCommonPath] = useState(''); // Common path input

  const handleChangeRtIds = (e) => {
    setRtIdsInput(e.target.value);
  };

  const handleChangeManualFileNames = (e) => {
    setManualFileNamesInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Split RT IDs and manual filenames by newlines, then trim
    const rtIds = rtIdsInput.split('\n').map(id => id.trim()).filter(id => id);
    const fileNames = manualFileNamesInput.split('\n').map(name => name.trim()).filter(name => name);
    
    // Ensure the number of filenames matches the number of RT IDs
    if(fileNames.length > 0){
    if (rtIds.length !== fileNames.length) {
      alert('The number of RT IDs must match the number of filenames.');
      return;
    }
  }

    // Construct the rtData array, each RT ID with its corresponding filename and path
    const rtData = rtIds.map((id, index) => ({
      id,
      path: useSamePath ? commonPath : '',
      manualFileName: fileNames[index] || '' // Corresponding filename for each RT ID
    }));

    onSubmit(rtData); // Call the onSubmit prop with the rtData array
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        placeholder="Enter RT IDs (one per line)"
        value={rtIdsInput}
        onChange={handleChangeRtIds}
        rows={10}
        required
      />

      <textarea
        placeholder="Enter filenames (one per line, must match RT IDs)"
        value={manualFileNamesInput}
        onChange={handleChangeManualFileNames}
        rows={10}
      />

      <div>
        <input
          type="checkbox"
          checked={useSamePath}
          onChange={(e) => setUseSamePath(e.target.checked)}
        />
        <label>Give the path for above assets</label>
        {useSamePath && (
          <input
            type="text"
            placeholder="Common Path"
            value={commonPath}
            onChange={(e) => setCommonPath(e.target.value)}
            required
          />
        )}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
};

export default Form;

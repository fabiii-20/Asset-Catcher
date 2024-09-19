import React, { useState } from 'react';

const Form = ({ onSubmit }) => {
  const [rtIds, setRtIds] = useState([{ id: '', path: '', name: '' }]);
  const [useSamePath, setUseSamePath] = useState(false);
  const [commonPath, setCommonPath] = useState('');

  const handleChange = (index, field, value) => {
    const newRtIds = [...rtIds];
    newRtIds[index][field] = value;
    setRtIds(newRtIds);
  };

  const addRtId = () => {
    setRtIds([...rtIds, { id: '', path: '', name: '' }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(rtIds.map(rt => ({
      ...rt,
      path: useSamePath ? commonPath : rt.path
    })));
  };

  return (
    <form onSubmit={handleSubmit}>
      {rtIds.map((rt, index) => (
        <div key={index}>
          <input
            type="text"
            placeholder="RT ID"
            value={rt.id}
            onChange={(e) => handleChange(index, 'id', e.target.value)}
            required
          />
          {!useSamePath && (
            <input
              type="text"
              placeholder="Path"
              value={rt.path}
              onChange={(e) => handleChange(index, 'path', e.target.value)}
              required
            />
          )}
          <input
            type="text"
            placeholder="File Name"
            value={rt.name}
            onChange={(e) => handleChange(index, 'name', e.target.value)}
            required
          />
        </div>
      ))}
      <button type="button" onClick={addRtId}>Add RT ID</button>
      <div>
        <input
          type="checkbox"
          checked={useSamePath}
          onChange={(e) => setUseSamePath(e.target.checked)}
        />
        <label>Use the same path for all</label>
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

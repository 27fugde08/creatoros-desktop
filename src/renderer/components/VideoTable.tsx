import React, { useState, useMemo } from 'react';

const VideoTable = ({ data = [] }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [minViews, setMinViews] = useState(0);

  // Lọc dữ liệu
  const filteredData = useMemo(() => {
    return data.filter(item => item.views >= minViews);
  }, [data, minViews]);

  // Handle Selection
  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDownload = async () => {
    const result = await window.electronAPI.invoke('download-videos', selectedIds);
    alert(`Đã tải xuống vào: ${result.path}`);
  };

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-4">
        <input 
          type="number" 
          placeholder="Min Views" 
          onChange={(e) => setMinViews(Number(e.target.value))}
          className="border p-2"
        />
        <button onClick={handleDownload} className="bg-blue-500 text-white p-2">
          Tải xuống {selectedIds.length} video
        </button>
      </div>

      <table className="w-full border">
        <thead>
          <tr>
            <th><input type="checkbox" /></th>
            <th>STT</th>
            <th>Tiêu đề</th>
            <th>Views</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, idx) => (
            <tr key={item.id}>
              <td><input type="checkbox" onChange={() => toggleSelect(item.id)} /></td>
              <td>{idx + 1}</td>
              <td>{item.title}</td>
              <td>{item.views}</td>
              <td>...</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VideoTable;

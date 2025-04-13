import { useState, useEffect } from 'react';
import { FaPlay, FaPause, FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';

const RecordingsList = () => {
  const [recordings, setRecordings] = useState([]);
  const [playingRecording, setPlayingRecording] = useState(null);
  const [audioInstance, setAudioInstance] = useState(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = () => {
    const savedRecordings = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('recording-')) {
        savedRecordings.push({
          name: key,
          url: localStorage.getItem(key),
        });
      }
    }
    setRecordings(savedRecordings);
  };

  const togglePlayRecording = (url, name) => {
    if (playingRecording === name) {
      audioInstance.pause();
      setPlayingRecording(null);
      return;
    }

    if (audioInstance) {
      audioInstance.pause();
    }

    const newAudio = new Audio(url);
    setAudioInstance(newAudio);
    newAudio.play();
    setPlayingRecording(name);

    newAudio.onended = () => setPlayingRecording(null);
    newAudio.onerror = () => setPlayingRecording(null);
  };

  const playRecording = (url, name) => {
    try {
      const audio = new Audio(url);
      audio.play();
      setPlayingRecording(name);
      audio.onended = () => setPlayingRecording(null);
      audio.onerror = (error) => {
        console.error('Playback error:', error);
        setPlayingRecording(null);
      };
    } catch (error) {
      console.error('Error playing recording:', error);
      setPlayingRecording(null);
    }
  };

  const deleteRecording = (name) => {
    localStorage.removeItem(name);
    loadRecordings();
  };

  const renameRecording = (oldName, newName) => {
    const url = localStorage.getItem(oldName);
    localStorage.setItem(`recording-${newName}`, url);
    localStorage.removeItem(oldName);
    loadRecordings();
  };

  const [renameInput, setRenameInput] = useState({
    name: '',
    newName: '',
    showInput: false,
  });

  const handleRenameClick = (name) => {
    setRenameInput({
      name: name,
      newName: name.replace('recording-', ''),
      showInput: true,
    });
  };

  const handleRenameSubmit = () => {
    renameRecording(renameInput.name, renameInput.newName);
    setRenameInput({ ...renameInput, showInput: false });
  };

  return (
    <div className="p-8 bg-gray-50 rounded-2xl shadow-xl max-w-4xl w-full">
      <h2 className="text-3xl font-semibold mb-8 text-center text-gray-800 border-b pb-4">
        Saved Recordings
      </h2>
      {recordings.length === 0 ? (
        <p className="text-gray-600 text-center">No recordings saved yet.</p>
      ) : (
        <ul className="space-y-4 w-full">
          {recordings.map((recording) => (
            <li
              key={recording.name}
              className="flex items-center justify-between p-2 bg-blue-50 shadow rounded-xl border border-gray-200 w-full max-w-4xl mx-auto"
            >
              {renameInput.showInput && renameInput.name === recording.name ? (
                <div className="flex items-center space-x-3 w-full">
                  <input
                    type="text"
                    value={renameInput.newName}
                    onChange={(e) =>
                      setRenameInput({ ...renameInput, newName: e.target.value })
                    }
                    className="border p-2 rounded-lg flex-grow text-sm"
                  />
                  <button
                    onClick={handleRenameSubmit}
                    className=" hover:bg-blue-700 text-black px-3 py-1 rounded-lg text-sm"
                  >
                    <FaCheck />
                  </button>
                  <button
                    onClick={() =>
                      setRenameInput({ ...renameInput, showInput: false })
                    }
                    className=" hover:bg-gray-400 text-gray-700 px-3 py-1 rounded-lg text-sm"
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <div className="flex items-center w-full">
                  <span className="text-sm text-gray-800 font-medium flex-grow truncate">
                    {recording.name.replace('recording-', '')}
                    {playingRecording === recording.name && (
                      <span className="ml-2 text-green-600 font-normal">(Playing)</span>
                    )}
                  </span>
                  <div className="flex space-x-2">
                  <button
                  onClick={() => togglePlayRecording(recording.url, recording.name)}
                  className={`px-3 py-2 rounded-lg text-white transition-all duration-200 ${
                    playingRecording === recording.name
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {playingRecording === recording.name ? <FaPause /> : <FaPlay />}
                </button>
                
                    <button
                      onClick={() => deleteRecording(recording.name)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      <FaTrash />
                    </button>
                    <button
                      onClick={() => handleRenameClick(recording.name)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      <FaEdit />
                    </button>
                  </div>
                  
                </div>
                
              )}
              
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecordingsList;
import { useState } from 'react';
import Recorder from './components/VoiceRecorder';
import RecordingsList from './components/RecordingsList';

function App() {
  const [showRecordings, setShowRecordings] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-200 to-indigo-300 text-gray-800">
      <h1 className="text-4xl font-extrabold mb-6 text-indigo-700 drop-shadow-md">Voice Recorder</h1>
      <div className="p-10 w-full max-w-5xl flex flex-col items-center">
        {!showRecordings ? <Recorder /> : <RecordingsList />}
        <button
          onClick={() => setShowRecordings(!showRecordings)}
          className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-md transform hover:scale-105"
        >
          {showRecordings ? 'Back to Recorder' : 'View Recordings'}
        </button>
      </div>
    </div>
  );
}

export default App;
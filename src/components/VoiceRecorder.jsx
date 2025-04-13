import { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaPause, FaPlay, FaStop, FaDownload, FaSave } from 'react-icons/fa';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const Recorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const mediaRecorder = useRef(null);
  const animationFrameId = useRef(null);
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const canvasRef = useRef(null);
  const startTime = useRef(0);

  useEffect(() => {
    let intervalId;
    if (isRecording && !isPaused) {
      startTime.current = Date.now() - recordingTime;
      intervalId = setInterval(() => {
        setRecordingTime(Date.now() - startTime.current);
      }, 100);
    } else {
      clearInterval(intervalId);
    }
    return () => clearInterval(intervalId);
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      setError(null);
      setAudioChunks([]);
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      analyser.current = audioContext.current.createAnalyser();
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyser.current);
      analyser.current.fftSize = 2048;

      const bufferLength = analyser.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const drawWaveform = () => {
        animationFrameId.current = requestAnimationFrame(drawWaveform);
        analyser.current.getByteFrequencyData(dataArray); // Use frequency data for visualization

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear the canvas
        canvasCtx.fillStyle = '#f0f0f0'; // Light background
        canvasCtx.fillRect(0, 0, width, height);

        // Draw the waveform
        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height;

          // Use a gradient for a more professional look
          const gradient = canvasCtx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, '#3498db'); // Blue
          gradient.addColorStop(1, '#2c3e50'); // Dark blue

          canvasCtx.fillStyle = gradient;
          canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);

          x += barWidth + 1; // Add spacing between bars
        }
      };

      drawWaveform();

      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        }
      };
      mediaRecorder.current.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      setError('Microphone access denied or error occurred.');
      console.error('Error starting recording:', err);
      stopRecording();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder.current && isRecording && isPaused) {
      mediaRecorder.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      cancelAnimationFrame(animationFrameId.current);
      if (audioContext.current) {
        audioContext.current.close();
      }
    }
  };

  const handleDownload = async () => {
    if (audioChunks.length > 0) {
      console.log('Starting download process...');
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const arrayBuffer = await audioBlob.arrayBuffer();
      console.log('Audio blob created:', audioBlob);

      // Initialize FFmpeg
      const ffmpeg = new FFmpeg();
      console.log('Initializing FFmpeg...');
      await ffmpeg.load();
      console.log('FFmpeg initialized.');

      // Write the input file (WebM) to FFmpeg's file system
      console.log('Writing input file to FFmpeg...');
      await ffmpeg.writeFile('input.webm', await fetchFile(new Blob([arrayBuffer], { type: 'audio/webm' })));
      console.log('Input file written.');

      // Run FFmpeg to convert WebM to MP3
      console.log('Converting WebM to MP3...');
      await ffmpeg.exec(['-i', 'input.webm', '-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k', 'output.mp3']);
      console.log('Conversion complete.');

      // Read the output file (MP3) from FFmpeg's file system
      console.log('Reading output file...');
      const mp3Data = await ffmpeg.readFile('output.mp3');
      console.log('Output file read.');

      // Create a Blob and download the MP3 file
      console.log('Creating MP3 Blob...');
      const mp3Blob = new Blob([mp3Data], { type: 'audio/mp3' });
      const url = window.URL.createObjectURL(mp3Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recording.mp3';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      console.log('Download complete.');
    }
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const saveRecording = () => {
    if (audioChunks.length > 0) {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const timestamp = Date.now();
      const recordingName = `recording-${timestamp}`; // Unique name
      localStorage.setItem(recordingName, audioUrl);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <canvas ref={canvasRef} width={400} height={100} className="mb-4 rounded-full bg-slate-100"></canvas>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <div className="flex items-center mb-4 space-x-4">
        <button
          onClick={isRecording ? (isPaused ? resumeRecording : pauseRecording) : startRecording}
          className={`p-4 rounded-full ${
            isRecording
              ? isPaused
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isRecording ? (isPaused ? <FaPlay /> : <FaPause />) : <FaMicrophone />}
        </button>
        {isRecording && (
          <span className="text-gray-700">{formatTime(recordingTime)}</span>
        )}
      </div>
      {isRecording && (
        <button
          onClick={stopRecording}
          className="bg-gray-400 hover:bg-gray-500 text-white p-2 rounded items-center"
        >
          <FaStop />
        </button>
      )}
      {audioChunks.length > 0 && (
        <div className="flex space-x-2 mt-4">
          <button
            onClick={handleDownload}
            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded flex items-center space-x-2"
          >
            <FaDownload /> <span>Download</span>
          </button>
          <button
            onClick={saveRecording}
            className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded flex items-center space-x-2"
          >
            <FaSave /> <span>Save</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Recorder;
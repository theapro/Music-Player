import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "./Themecontext";

import {
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";
import { FaFastForward } from "react-icons/fa";
import { FaFastBackward } from "react-icons/fa";
import { FaRepeat } from "react-icons/fa6";
import { FaShuffle } from "react-icons/fa6";
import { MdOutlineSpeed } from "react-icons/md";


const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioFiles, setAudioFiles] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const audioRef = useRef(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [gifSrc, setGifSrc] = useState(null);
  const isAudioSelected = currentSongIndex !== null;
  const { theme, toggleTheme, colors } = useTheme();
  
  
  
  useEffect(() => {
    const fetchSongs = async () => {
        try {
            const response = await fetch(
                "https://api.jamendo.com/v3.0/tracks/?client_id=26950188&format=json&limit=50"
            );

            if (!response.ok) {
                throw new Error(`Server javobi noto'g'ri: ${response.status}`);
            }

            const data = await response.json();
            console.log(data);

            const songs = data.results.map((track) => ({
              title: track.name || "No title",
              artist: track.artist_name || "Unknown artist",
              audioURL: track.audio || "", 
              cover: track.image || "",
          }));
          console.log("First Audio URL:", songs[0]?.audioURL);
          

            console.log("Fetched Songs:", songs);
            setAudioFiles(songs);
            setCurrentSongIndex(0);
        } catch (error) {
            console.error("Qo'shiqlarni olishda xatolik:", error);
        }
    };

    fetchSongs();
}, []);


  // play/pause

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  // Listen for audio events
  useEffect(() => {
    const audioElement = audioRef.current;

    const onPlay = () => {
      setIsPlaying(true);
      setGifSrc("../../src/assets/dance.gif");
    };

    const onPause = () => {
      setIsPlaying(false);
      setGifSrc("../../src/assets/gifpause.jpg");
    };

    const onEnded = () => {
      setIsPlaying(false);
      setGifSrc("../../src/assets/gifpause.jpg");
    };

    if (audioElement) {
      audioElement.addEventListener("play", onPlay);
      audioElement.addEventListener("pause", onPause);
      audioElement.addEventListener("ended", onEnded);
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener("play", onPlay);
        audioElement.removeEventListener("pause", onPause);
        audioElement.removeEventListener("ended", onEnded);
      }
    };
  }, []);

  //preogress bar
  const handleProgress = () => {
    const currentTime = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    if (duration) {
      setProgress((currentTime / duration) * 100);
      setCurrentTime(currentTime);
    }
  };
  const handleLoadedMetadata = () => {
    const duration = audioRef.current.duration;
    setDuration(duration);
    audioRef.current.play();
  };

  //next/prev
  const handleNext = () => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * audioFiles.length);
      setCurrentSongIndex(randomIndex);
    } else if (isRepeat) {
      audioRef.current.currentTime = 0;
      audioRef.current.play(); // Play from the beginning
    } else {
      setCurrentSongIndex((prevIndex) => (prevIndex + 1) % audioFiles.length);
    }
  };
  const handlePrevious = () => {
    setCurrentSongIndex(
      (prevIndex) => (prevIndex - 1 + audioFiles.length) % audioFiles.length
    );
  };

  //Time
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes < 10 ? "0" : ""}${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
  };

  //volume change
  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (!isMuted) audioRef.current.volume = newVolume;
  };

  //Mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      audioRef.current.volume = 0;
    } else {
      audioRef.current.volume = volume;
    }
  };

  //skip backward/forward
  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.currentTime + 10,
        audioRef.current.duration
      );
    }
  };
  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        audioRef.current.currentTime - 10,
        0
      );
    }
  };

  // shuffle
  const handleShuffle = () => {
    if (isRepeat) {
      setIsRepeat(false);
    }
    setIsShuffle(!isShuffle);
  };

  // repeat
  const handleRepeat = () => {
    if (isShuffle) {
      setIsShuffle(false);
    }
    setIsRepeat(!isRepeat);
  };

  //Progress bar controll
  const handleProgressBarClick = (e) => {
    const progressBar = e.target;
    const clickPosition = e.nativeEvent.offsetX;
    const newTime = (clickPosition / progressBar.offsetWidth) * duration;
    audioRef.current.currentTime = newTime;
    setProgress((clickPosition / progressBar.offsetWidth) * 100);
  };

  //Playback
  const handlePlaybackSpeedChange = (speed) => {
    setPlaybackSpeed(speed);

    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setIsDropdownVisible(false);
  };
  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
      console.log("Now playing:", audioFiles[currentSongIndex]?.audioURL);
    }
  }, [currentSongIndex, playbackSpeed]);

  //Lyrics
  const [activeTab, setActiveTab] = React.useState("playlist");

  //Shortcuts
  useEffect(() => {
    const handleKeydown = (event) => {
      if (currentSongIndex === null) {
        return;
      }

      switch (event.key) {
        case " ":
          togglePlayPause(); // Play/Pause
          break;
        case "ArrowRight":
          handleNext(); // Next
          break;
        case "ArrowLeft":
          handlePrevious(); // Prev
          break;
        case "S":
          if (event.shiftKey) {
            handleShuffle(); // Shuffle
          }
          break;
        case "R":
          if (event.shiftKey) {
            handleRepeat(); // Repeat
          }
          break;
        case "N":
          if (event.shiftKey) {
            skipForward(); // 10 s
          }
          break;
        case "P":
          if (event.shiftKey) {
            skipBackward(); // 10 s
          }
          break;
        case "M":
          toggleMute(); // Mute
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [
    currentSongIndex,
    isPlaying,
    audioFiles,
    isShuffle,
    isRepeat,
    isMuted,
    volume,
  ]);

  return (
    <div className="font-poppins flex flex-col items-center min-h-screen "
    style={{
      background: colors.mainback,
    }}>
      {/* Music Image */}
      <div
        className="animate-slideIn2 p-3 fixed top-[15px] left-[300px] w-[430px] h-[430px] bg-white rounded-lg  mb-6"
        style={{
          borderRadius: "14px",
          background: colors.background,
          color: colors.text,
          boxShadow: colors.cardShadow,
        }}
      >
        <img
          src={
            audioFiles[currentSongIndex]?.cover || "../../src/assets/select.jpg"
          }
          alt="Music Cover"
          className="w-full h-full object-cover rounded-[14px]"
        />
      </div>

      {/* Music Info */}
      <div
        className="animate-scaleIn flex h-[calc(100vh-600px)] fixed top-[460px] left-[300px] w-[430px] bg-white rounded-lg shadow-custom py-4 px-6 text-black"
        style={{
          borderRadius: "14px",
          background: colors.background,
          color: colors.text,
          boxShadow: colors.cardShadow,
        }}
      >
        <div>
          <h2 className="text-[18px] font-semibold w-[200px]">
            {audioFiles[currentSongIndex]?.title || "Select a Song"}
          </h2>
          <p className="text-lg">
            {audioFiles[currentSongIndex]?.artist || "Choose an Audio File"}
          </p>
        </div>
        <div>
          {gifSrc && (
            <img
              src={gifSrc}
              alt="New Jeans"
              className="ml-4 mt-[-16px] w-[calc(100vh-10px)] h-[calc(100vh-600px)] rounded-lg"
            />
          )}
        </div>
      </div>

      {/* Playlis/Lyrics */}
      <div
        className="animate-slideInRight fixed top-[15px] right-[15px] h-[calc(100vh-155px)] w-[775px] bg-white text-black rounded-lg shadow-custom p-4 overflow-hidden"
        style={{
          borderRadius: "14px",
          background: colors.background,
          color: colors.text,
          boxShadow: colors.cardShadow,
        }}
      >
        {/* Playlis/Lyrics Nav */}
        <div className="flex gap-4 items-center mb-4 backdrop-blur-[]">
          <button
            onClick={() => setActiveTab("playlist")}
            className={`text-xl font-bold px-2 py-1 transition-colors duration-300 ${
              activeTab === "playlist" ? "text-codee" : "text-black"
            }`}
            style={{
              borderRadius: "5px",
              background: colors.background,
              color: colors.text,
              boxShadow: colors.cardshadowsml,
            }}
          >
            Playlist
          </button>
          <button
            onClick={() => setActiveTab("lyrics")}
            className={`text-xl font-bold px-2 py-1 transition-colors duration-300 ${
              activeTab === "lyrics" ? "text-codee" : "text-black"
            }`}
            style={{
              background: colors.background,
              color: colors.text,
              boxShadow: colors.cardshadowsml,
              borderRadius: "5px",
            }}
          >
            Lyrics
          </button>
        </div>

        {/* Dinamik kontent */}
        <div className="h-full  overflow-y-auto scrollbar-hidden pb-[60px] pt-2 px-1">
          {activeTab === "playlist" && (
            <div className="grid grid-cols-4 gap-4">
              {audioFiles.map((song, index) => (
                <div
                  key={index}
                  className={`p-2 relative group rounded-[14px] overflow-hidden bg-white shadow-md border-2 ${
                    index === currentSongIndex
                      ? "animate-bounceUpDown"
                      : "border-transparent"
                  }`}
                  onClick={() => setCurrentSongIndex(index)}
                >
                  <img
                    src={song.cover}
                    alt={song.title}
                    className="w-full h-[150px] object-cover rounded-[14px]"
                  />
                  <div className="p-2 text-center absolute inset-0 bg-black/40 backdrop-blur-[5px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <p className="text-white font-bold">{song.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "lyrics" && (
            <div className="p-1">
              <h3 className="text-xl font-bold mb-4">
                {audioFiles[currentSongIndex]?.title || "No Song Selected"}
              </h3>
              <div className="text-xl text-black mb-11">
                {audioFiles[currentSongIndex]?.lyrics
                  .split("\n\n")
                  .map((block, index) => (
                    <div key={index}>
                      {block.split("\n").map((line, lineIndex) => (
                        <p key={lineIndex}>{line}</p>
                      ))}
                      <br />
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Music control */}
      <div
        className="animate-slideInBottom fixed bottom-[15px] right-[15px] w-[1220px] bg-white text-black py-4 px-6 rounded-lg shadow-custom"
        style={{
          borderRadius: "14px",
          background: colors.background,
          color: colors.text,
          boxShadow: colors.cardShadow,
        }}
      >
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-1">
          <span>{formatTime(currentTime)}</span>
          <div
            className="w-full h-1 bg-gray-600 rounded-full overflow-hidden cursor-pointer"
            onClick={handleProgressBarClick}
          >
            <div
              className="h-full bg-codee rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between mt-3 w-full">
          {/* Volume */}
          <div className="flex items-center gap-4 rounded-full pr-2 backdrop-blur-sm border-[1px] border-black">
            <button
              onClick={toggleMute}
              className="text-black text-2xl py-2 px-4 rounded-full border-r-[1px] border-black backdrop-blur-2xl"
              disabled={!isAudioSelected}
            >
              {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer"
              disabled={!isAudioSelected}
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={skipBackward}
              className="text-black text-xl py-2 px-3 rounded-full hover:scale-110 hover:bg-gray-400 duration-300"
              disabled={!isAudioSelected}
            >
              <FaFastBackward />
            </button>
            <button
              onClick={handlePrevious}
              className="text-black text-2xl py-2 px-4 rounded-full hover:scale-110 hover:bg-gray-400 duration-300"
              disabled={!isAudioSelected}
            >
              <FaStepBackward />
            </button>
            <button
              onClick={togglePlayPause}
              className="text-black text-2xl py-2 px-4 border-2 border-black rounded-full hover:scale-110 hover:bg-gray-400 duration-300"
              disabled={!isAudioSelected}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button
              onClick={handleNext}
              className="text-black text-2xl py-2 px-4 rounded-full hover:scale-110 hover:bg-gray-400 duration-300"
              disabled={!isAudioSelected}
            >
              <FaStepForward />
            </button>
            <button
              onClick={skipForward}
              className="text-black text-xl py-2 px-3 rounded-full hover:scale-110 hover:bg-gray-400 duration-300"
              disabled={!isAudioSelected}
            >
              <FaFastForward />
            </button>
          </div>
          {/* Download */}

          <div className="flex justify-between">
            {/* Playback speed */}
            <div className="flex items-center">
              <div className="relative">
                <MdOutlineSpeed
                  className="cursor-pointer text-black text-4xl rounded-full duration-300 mr-3"
                  onClick={toggleDropdown} // Ikonaga bosganda dropdownni ko'rsatish yoki yashirish
                />

                {isDropdownVisible && (
                  <div className="absolute left-[-10px] top-[-250px] mt-2 bg-white shadow-lg rounded-md">
                    <button
                      onClick={() => handlePlaybackSpeedChange(0.5)}
                      className="w-full py-2 text-center"
                    >
                      0.5X
                    </button>
                    <button
                      onClick={() => handlePlaybackSpeedChange(1)}
                      className="w-full py-2 text-center"
                    >
                      Normal
                    </button>
                    <button
                      onClick={() => handlePlaybackSpeedChange(1.5)}
                      className="w-full py-2 text-center"
                    >
                      1.5X
                    </button>
                    <button
                      onClick={() => handlePlaybackSpeedChange(2)}
                      className="w-full py-2 text-center"
                    >
                      2X
                    </button>
                    <button
                      onClick={() => handlePlaybackSpeedChange(3)}
                      className="w-full py-2 text-center"
                    >
                      3X
                    </button>
                    <button
                      onClick={() => handlePlaybackSpeedChange(4)}
                      className="w-full py-2 text-center"
                    >
                      4X
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Repeat */}
            <button
              onClick={handleRepeat}
              className="text-black text-2xl py-2 px-4 rounded-full duration-300"
              disabled={!isAudioSelected}
            >
              <FaRepeat color={isRepeat ? "#39fc03" : "black"} />
            </button>
            {/* Shuffle  */}
            <button
              onClick={handleShuffle}
              className="text-black text-2xl py-2 px-4 rounded-full duration-300"
              disabled={!isAudioSelected}
            >
              <FaShuffle color={isShuffle ? "#39fc03" : "black"} />
            </button>
          </div>
        </div>
      </div>

      {/* Audio */}
      <audio
        ref={audioRef}
        src={audioFiles[currentSongIndex]?.audioURL}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleProgress}
        onEnded={handleNext}
      />

      {/* Style JSX */}
      <style jsx>{`
        .scrollbar-hidden {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }

        .shadow-custom {
          box-shadow: 10px 10px 15px rgba(0, 0, 0, 0.1);
        }

        .bg-codee {
          background-color: #39fc03;
        }
        :root {
          --primary: #ff930f;
        }

        .rangee {
          -webkit-appearance: none;
          height: 3px;
          width: 100%;
          background: var(--primary);
          border-radius: 10px;
          box-shadow: 0 0 5px var(--primary);
          cursor: pointer;
        }

        .rangee::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 10px;
          background: var(--primary);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--primary);
        }
      `}</style>
    </div>
  );
};

export default MusicPlayer;

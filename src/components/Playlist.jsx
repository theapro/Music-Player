import React, { useEffect, useState } from "react";
import { useTheme } from "./Themecontext";

const JamendoMusicPlayer = () => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("popularity_total");

  const fetchMusic = async (query = "", category = "popularity_total") => {
    const API_KEY = "26950188";
    const url = `https://api.jamendo.com/v3.0/tracks?client_id=${API_KEY}&limit=50&format=json&order=${category}${
      query ? `&search=${encodeURIComponent(query)}` : ""
    }`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.results) {
        const fetchedTracks = data.results.map((track) => ({
          audioURL: track.audio,
          title: track.name,
          artist: track.artist_name,
          cover: track.album_image || "https://via.placeholder.com/100",
        }));
        setAudioFiles(fetchedTracks);
      }
    } catch (error) {
      console.error("Error fetching music data:", error);
    }
  };

  useEffect(() => {
    fetchMusic("", category);
  }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMusic(searchQuery, category);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <div
      className="music-player w-screen h-screen flex items-center justify-center"
      style={{
        background: colors.mainback,
      }}
    >
      {selectedTrack ? (
        <MusicPlayer
          track={selectedTrack}
          onBack={() => setSelectedTrack(null)}
        />
      ) : (
        <Playlist
          audioFiles={audioFiles}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
          onCategoryChange={handleCategoryChange}
          category={category}
          onSelect={setSelectedTrack}
        />
      )}
    </div>
  );
};

const Playlist = ({
  audioFiles,
  searchQuery,
  setSearchQuery,
  onSearch,
  onCategoryChange,
  category,
  onSelect,
}) => {
  const { theme, toggleTheme, colors } = useTheme();
  return (
    <div
      className="animate-slideInRight playlist ml-[310px] mx-auto w-[78%] h-[calc(100vh-30px)] bg-black/30 text-black rounded-lg shadow-lg p-4 overflow-y-auto"
      style={{
        background: colors.background,
        color: colors.text,
        boxShadow: colors.cardShadow,
        borderRadius: "5px",
      }}
    >
      <div className="bg- gap-9 flex items-center justify-between mb-4">
        <span className="text-2xl font-bold text-black">Playlist</span>
        <form onSubmit={onSearch} className="mr-[-470px] flex">
          <input
            type="text"
            placeholder="Search for music (title or artist)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2  rounded w-[400px]"
            style={{
              background: colors.background,
              color: colors.text,
              boxShadow: colors.cardshadowsml,
              borderRadius: "5px",
            }}/>
          <button
            type="submit"
            className="ml-[-80px] px-4 py-2  border-l text-black rounded-md"
            style={{
              background: colors.background,
              color: colors.text,
            }}>
            Search
          </button
          >
        </form>
        <select
          value={category}
          onChange={onCategoryChange}
          className="ml-4 px-4 py-2  rounded "
          style={{
            background: colors.background,
            color: colors.text,
            boxShadow: colors.cardshadowsml,
            borderRadius: "5px",
          }}>
          <option value="popularity_total">Most Popular</option>
          <option value="popularity_month">Popular This Month</option>
          <option value="date_desc">New Releases</option>
        </select>
      </div>

      {audioFiles.length > 0 ? (
        <div className="grid grid-cols-4 gap-7 py-3 px-3">
          {audioFiles.map((file, index) => (
            <div
              key={index}
              className="card relative h-[250px] rounded-[14px] cursor-pointer overflow-hidden hover:scale-105 duration-300 transition-transform"
              onClick={() => onSelect(file)}
              style={{
                background: colors.background,
                color: colors.text,
                boxShadow: colors.cardShadow,
              }}
            >
              <img
                src={file.cover}
                alt={file.title}
                className="p-3 rounded-[24px] absolute top-0 left-0 w-full h-full object-cover z-0"
              />
              <div
                className=" absolute bottom-0 w-full bg-black/50 backdrop-blur-md text-white p-4 z-10"
                style={{
                  borderRadius: "0 0 14px 14px",
                }}
              >
                <h3 className="text-lg font-bold truncate">{file.title}</h3>
                <p className="text-sm truncate">{file.artist}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Loading music...</p>
      )}
    </div>
  );
};

const MusicPlayer = ({ track, onBack }) => {
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <div className="fixed left-[310px] w-[1200px] h-[calc(100vh-30px)] music-player-container p-4"style={{
      background: colors.background,
      color: colors.text,
      boxShadow: colors.cardShadow,
      borderRadius: "5px",
    }}>
      <button onClick={onBack} className="text-2xl font-bold mb-4">
        Back to Playlist
      </button>
      <div className="player  shadow- rounded-lg p-4">
        <img
          src={track.cover}
          alt={track.title}
          className="w-full h-[calc(65vh-30px)] object-cover rounded-md mb-4"
        />
        <h3 className="text-2xl font-bold">{track.title}</h3>
        <p className="text-gray-600 mb-4">{track.artist}</p>
        <audio controls src={track.audioURL} className="w-full "
        ></audio>
      </div>

      <style jsx>{`
        .playlist {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }

        .playlist::-webkit-scrollbar {
          display: none; /* Chrome, Safari */
        }
      `}</style>
    </div>
  );
};

export default JamendoMusicPlayer;

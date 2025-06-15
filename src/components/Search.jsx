import React, { useState, useRef } from "react";
import { CiMicrophoneOn } from "react-icons/ci";
import { useTheme } from "./Themecontext";

const VoiceSearch = () => {
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [songInfo, setSongInfo] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const { theme, toggleTheme, colors } = useTheme();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const startRecording = async () => {
    if (navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioStreamRef.current = stream;
        mediaRecorderRef.current = new MediaRecorder(stream);

        let chunks = [];
        mediaRecorderRef.current.ondataavailable = (event) => {
          chunks.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/mp3" });
          setRecordedBlob(blob);
        };

        mediaRecorderRef.current.start();
        setListening(true);
        setNotification("Recording audio...");
        setTimeout(stopRecording, 7000);
      } catch (err) {
        setError("Failed to access microphone: " + err.message);
        setNotification("");
      }
    } else {
      setError("Your browser does not support audio recording.");
      setNotification("");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      setListening(false);
      setNotification("");
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }
  
    const allowedTypes = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/webm"];
    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
    const allowedExtensions = ["mp3", "wav", "webm"];

    if (
      !allowedTypes.includes(selectedFile.type) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      setError("Invalid file format. Please upload an mp3, wav, or webm file.");
      return;
    }

    console.log("Uploading file:", selectedFile);

    const data = new FormData();
    data.append("upload_file", selectedFile);

    try {
      const response = await fetch(
        "https://shazam-api6.p.rapidapi.com/shazam/recognize/",
        {
          method: "POST",
          headers: {
            "x-rapidapi-key":
              "5955ec3393msh65067b910966f6ap11f2d3jsn1bc56f06b610",
            "x-rapidapi-host": "shazam-api6.p.rapidapi.com",
          },
          body: data,
        }
      );

      const result = await response.json();
      console.log("Full API Response:", result);

      if (!response.ok) {
        setError(`API error: ${result.message || "Unknown error"}`);
        return;
      }

      if (result && result.track) {
        setSongInfo(result);
        setNotification("");
      } else {
        setError("No song found. Please try uploading a different file.");
        setNotification("No song found. Please try again.");
      }
    } catch (err) {
      setError("Error in song recognition: " + err.message);
      console.error("Fetch error:", err);
    }
  };

  {
    notification && <p className="text-green-500">{notification}</p>;
  }
  {
    error && <p className="text-red-500">{error}</p>;
  }
  console.log("Selected File:", selectedFile);

  const handleRecordedAudioUpload = async () => {
    if (recordedBlob) {
      const file = new File([recordedBlob], "audio.mp3", { type: "audio/mp3" });
      setSelectedFile(file);
      await handleFileUpload();
    }
  };

  const style = {
    clipPath: listening
      ? "polygon(100% 50%,90.45% 79.39%,65.45% 97.55%,34.55% 97.55%,9.55% 79.39%,0% 50%,9.55% 20.61%,34.55% 2.45%,65.45% 2.45%,90.45% 20.61%)"
      : "",
    Animation: listening ? "animate-slideIn" : "",
  };

  return (
    <div
      className=" font-poppins flex flex-col items-center justify-center min-h-screen bg-[#e0e0e0] text-gray-800"
      style={{
        background: colors.mainback,
      }}
    >
      <div
        className="animate-scaleIn fixed h-[calc(100vh-30px)] top-[15px] left-[305px] bg-white p-10 w-[696px]"
        style={{
          background: colors.background,
          color: colors.text,
          boxShadow: colors.cardShadow,
          borderRadius: "14px",
        }}
      >
        <div>
          <h1 className="text-2xl font-semibold mb-6">Voice Search</h1>
        </div>
        <div>
          <div className="flex flex-col items-center py-[20px]">
            <button
              onClick={listening ? stopRecording : startRecording}
              className={`px-[77px] w-[250px] h-[250px] text-[100px] rounded-full text-black font-medium duration-500 ${
                listening
                  ? "bg-black cursor-not-allowed animate-rotate w-[270px] h-[270px] px-[87px] shadow-customOuter  text-white"
                  : "bg-white hover: shadow-customInner animate-bounceUpDownn"
              }`}
              disabled={listening}
              style={style}
            >
              {listening ? <CiMicrophoneOn /> : <CiMicrophoneOn />}
            </button>
            <div className=" flex items-center flex-col">
              {recordedBlob && (
                <div className="mt-6">
                  <button
                    onClick={handleRecordedAudioUpload}
                    className="mt-3 px-4 py-2 bg-black text-white rounded-lg hover:b "
                  >
                    Find music
                  </button>
                </div>
              )}

              {notification && (
                <p className="text-black mt-4 ">{notification}</p>
              )}
            </div>
          </div>
          <div
            className="rounded-[14px] px-[10px] pt-[70px] mt-[-30px] "
            onClick={() => {
              if (songInfo && songInfo.track) {
                const songName = songInfo.track.title;
                const artistName = songInfo.track.subtitle;
                const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
                  songName
                )}+${encodeURIComponent(artistName)}`;
                window.open(googleSearchUrl, "_blank");
              }
            }}
          >
            {songInfo && songInfo.track && (
              <div
                className="animate-slideIn mt-[-10px] py-[20px] px-[30px] bg-white h-[calc(100vh-605px)] rounded-lg w-[600px]"
                style={{
                  background: colors.background,
                  color: colors.text,
                  borderRadius: "14px",
                  boxShadow: colors.cardshadowsml ,
                }}
              >
                <p className="text-lg font-semibold">Song Info:</p>
                <div className="mt-2 flex items-center">
                  <p className="text-gray-700 font-poppins">Song Name:</p>
                  <p className="ml-2 font-poppins font-semibold">
                    {songInfo.track.title}
                  </p>
                </div>
                <div className=" flex items-center">
                  <p className="text-gray-700 font-poppins">Artist:</p>
                  <p className="ml-2 font-poppins font-semibold">
                    {songInfo.track.subtitle}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* RightSec */}
      <div className=" font-poppins flex flex-col items-center justify-center min-h-screen bg-[#e0e0e0] text-gray-800">
        <div
          className="animate-slideInRight fixed h-[calc(100vh-30px)] top-[15px] right-[15px] bg-white p-10 w-[500px]"
          style={{
            background: colors.background,
            color: colors.text,
            borderRadius: "14px",
            boxShadow: colors.cardShadow,
          }}
        >
          <h1 className="text-2xl font-semibold mb-6">Upload Search</h1>
          <div className="flex  gap-4 items-center py-4">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
            />
            <button
              onClick={() => document.getElementById("fileInput").click()}
              className="px-4 py-2 hover:scale-105 duration-300  text-black rounded-lg hover:bg-white/90 w-[500px] h-[100px]"
              style={{
                background: colors.background,
                color: colors.text,
                borderRadius: "14px",
                boxShadow: colors.cardshadowsml ,
              }}
            >
              Select File
            </button>
            <button
              onClick={handleFileUpload}
              className="px-4 py-2 bg-black text-white rounded-lg hover:scale-105 h-[100px] duration-300"
              style={{
                background: colors.background,
                color: colors.text,
                borderRadius: "14px",
                boxShadow: colors.cardshadowsml ,
              }}
            >
              Upload & Find Music
            </button>

            {/* {error && <p className="text-red-500 mt-2">{error}</p>} */}
          </div>
          <div
            style={{
              background: colors.background,
              color: colors.text,
              borderRadius: "14px",
              boxShadow: colors.cardshadowsml,
            }}
          >
            {songInfo && songInfo.track && (
              <div
                className="py-4 px-6 bg-white mt- rounded-lg w-full shadow-md h-[130px]"
                style={{
                  background: colors.background,
                  color: colors.text,
                  borderRadius: "14px",
                  boxShadow: colors.cardshadowsml,
                }}
              >
                <p className="text-lg font-semibold">Song Info:</p>
                <p className="text-gray-700">
                  Song Name: {songInfo.track.title}
                </p>
                <p className="text-gray-700">
                  Artist: {songInfo.track.subtitle}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSearch;

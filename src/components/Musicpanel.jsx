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
  const [showLyrics, setShowLyrics] = useState(false);
  const isAudioSelected = currentSongIndex !== null;
  const { theme, toggleTheme, colors } = useTheme();

  //get cover image
  const extractCoverImage = (audioFile, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const dataView = new DataView(arrayBuffer);

      if (
        dataView.getUint8(0) === 73 &&
        dataView.getUint8(1) === 68 &&
        dataView.getUint8(2) === 51
      ) {
        let imageData = null;

        let i = 0;
        while (i < arrayBuffer.byteLength) {
          if (
            dataView.getUint8(i) === 0xff &&
            dataView.getUint8(i + 1) === 0xd8
          ) {
            imageData = arrayBuffer.slice(i);
            break;
          }
          i++;
        }

        if (imageData) {
          const imageURL = URL.createObjectURL(new Blob([imageData]));
          callback(imageURL);
        } else {
          callback("../../src/assets/nocover.jpg");
        }
      } else {
        callback("../../src/assets/nocover.jpg");
      }
    };

    reader.readAsArrayBuffer(audioFile);
  };

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

  //File choose
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const updatedAudioFiles = files.map((file) => {
      return new Promise((resolve) => {
        extractCoverImage(file, (cover) => {
          resolve({
            file: file,
            audioURL: URL.createObjectURL(file),
            title: file.name,
            artist: "  ",
            cover: cover,
          });
        });
      });
    });

    Promise.all(updatedAudioFiles).then((newFiles) => {
      setAudioFiles((prevFiles) => [...prevFiles, ...newFiles]);
    });
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
    }
  }, [currentSongIndex, playbackSpeed]);

  // Doimiy qo'shiqlar
  const defaultSongs = [
    {
      title: "Monolith",
      artist: "Twin Tribes",
      audioURL: "../../src/assets/Monolith - Twin Tribes.m4a",
      cover: "../../src/assets/monolith.jpg",
      lyrics: `[Verse 1]
Trust in me
I will rise
Through the fire, in the sky

Set me free
Ancient lies
Is this peace divine?
The light will cast me aside

[Chorus 1]
Me envenena
Te envenena
Me envenena
Te envenena

[Verse 2]
Trust in me
As I am
Shattering inside

The vision upon us
The memory remains
Nothing to defy
The light will cast me aside
See upcoming pop shows
Get tickets for your favorite artists

You might also like
Darling, I
Tyler, The Creator
She Knows
J. Cole
Big Foot
Nicki Minaj

[Chorus 2]
Bring me to silence
A rite for the heart
Bring me to silence
Through the light

Bring me to silence
A rite for the heart
Bring me to silence
Through the light

[Chorus 1]
Me envenena
Te envenena
Me envenena
Te envenena

[Chorus 2]
Bring me to silence
A rite for the heart
Bring me to silence
Through the light

Bring me to silence
A rite for the heart
Bring me to silence
Through the light


Bring me to silence
A rite for the heart
Bring me to silence
Through the light

Bring me to silence
A rite for the heart
Bring me to silence
Through the light

[Chorus 1]
Me envenena
Te envenena
Me envenena
Te envenena`,
    },
    {
      title: "Let it happen",
      artist: "Tame Impala",
      audioURL: "../../src/assets/letithappen.mp3",
      cover: "../../src/assets/musicimage.jpg",
      lyrics: `[Verse 1]
It's always around me, all this noise
But not nearly as loud as the voice saying
"Let it happen, let it happen (It's gonna feel so good)
Just let it happen, let it happen"

[Chorus]
All this running around trying to cover my shadow
A notion growing inside, now all the others seem shallow
All this running around bearing down on my shoulders
I can hear an alarm, must be morning

[Verse 2]
I heard about a whirlwind that's coming 'round
It's gonna carry off all that isn't bound
And when it happens, when it happens (I won't be holding on)
So let it happen, let it happen

[Chorus]
All this running around, I can't fight it much longer
Something's trying to get out and it's never been closer
If my take-off fails, make up some other story
But if I never come back, tell my mother I'm sorry

[Instrumental Bridge]
See upcoming rock shows
Get tickets for your favorite artists

You might also like
THE HEART PART 6
Drake
So Long, London
Taylor Swift
The Tortured Poets Department
Taylor Swift

[Refrain]
I cuh-nuh duh-wuh, you wuh-nuh scri-wih
Try-guh-duh do-wee, try to pun-stoo-wee
You wuh-nuh thinkin' that I wuh-luh do-wee
They be lovin' someone and I wuh-nuh stuh-wee
Take the next ticket to take the next train
Why would I do-wee, eh you wuh tun-tun na
I cuh-nuh duh-wuh, you wuh-nuh scri-wih
Try-guh-duh do-wee, try to pun-stoo-wee
You wuh-nuh thinkin' that I wuh-luh do-wee
They be lovin' someone and I wuh-nuh stuh-wee
Take the next ticket to take the next train
Why would I do-wee, eh you wuh tun-tun

[Guitar Solo]

[Refrain]
I cuh-nuh duh-wuh, you wuh-nuh scri-wih
Try-guh-duh do-wee, try to pun-stoo-wee
You wuh-nuh thinkin' that I wuh-nuh do-wee
They be lovin' someone and I wuh-luh stuh-wee
Take the next ticket to take the next train
Why would I do-wee, eh you wuh tun-tun na

[Outro]
Baby, now I'm ready, moving on
Oh, but maybe I was ready all along
Oh, I'm ready for the moment and the sound
Oh, but maybe I was ready all along
Oh, baby, now I'm ready, moving on
Oh, but maybe I was ready all along
Oh, I'm ready for the moment and the sound
Oh, but maybe I was ready all along
Oh, baby`,
    },
    {
      title: "Jersey club",
      artist: "Newjeans",
      audioURL: "../../src/assets/newjeans.mp3",
      cover: "../../src/assets/newjeans.jpg",
      lyrics: `[뉴진스 "New Jeans" 가사]

[Verse 1: Haerin, Danielle, Hanni]
Look, it's a new me
Switched it up, who's this?
우릴 봐 NewJeans
So fresh, so clean
얼마나
기다렸던 날
드디어
Time to step out
또 한 번 더
Ready for sure
To have some more

[Chorus: Minji, Hyein]
New hair, new tee
NewJeans, do you see?
New hair, new tee
NewJeans, do you see?
New hair, new tee
NewJeans, do you see?
New hair, new tee
NewJeans, do you see?

[Refrain: Haerin, Minji, Hyein, Danielle]
Make it feel like a game
Look at us, we go on and on again
We'll go on to the end
What we wanna do, on and on again
Make it feel like a game
Look at us, we go on and on again
We'll go on to the end
What we wanna do, on and on again
See upcoming pop shows
Get tickets for your favorite artists

You might also like
Seven (Clean Ver.)
Jung Kook (정국) & Latto
making the bed
Olivia Rodrigo
lacy
Olivia Rodrigo

[Verse 2: Hanni, Hyein, Minji]
Look, it's a new me
Switched it up, who's this?
들어봐 NewJeans
So fresh, so clean
얼마나
기다렸던 날
드디어
Feeling's so right
또 한 번 더
I need to know
You want some more

[Chorus: Haerin, Danielle]
New hair, new tee
NewJeans, you and me
New hair, new tee
NewJeans, you and me
New hair, new tee
NewJeans, you and me
New hair, new tee
NewJeans, you and me`,
    },
    {
      title: "Washing machine heart",
      artist: "Mitski",
      audioURL: "../../src/assets/washinghart.mp3",
      cover: "../../src/assets/heart.jpg",
      lyrics: `[Verse 1]
Toss your dirty shoes in my washing machine heart
Baby, bang it up inside
I'm not wearing my usual lipstick
I thought maybe we would kiss tonight

[Pre-Chorus]
Baby, will you kiss me already?
And toss your dirty shoes in my washing machine heart
Baby, bang it up inside

[Verse 2]
Baby, though I've closed my eyes
I know who you pretend I am
I know who you pretend I am

[Bridge]
But, do-mi-ti
Why not me? Why not me?
Do-mi-ti
Why not me? Why not me?

[Chorus]
Do-mi-ti
Why not me? Why not me?`,
    },
    {
      title: "FEIN!",
      artist: "Travis Scott",
      audioURL: "../../src/assets/FEIN.mp3",
      cover: "../../src/assets/FEIN.avif",
      lyrics: `[Intro: Travis Scott & Sheck Wes]
Just come outside for the night (Yeah)
Take your time, get your light (Yeah)
Johnny Dang, yeah, yeah
I been out geekin' (Bitch)

[Chorus: Travis Scott]
FE!N, FE!N, FE!N, FE!N, FE!N (Yeah)
FE!N, FE!N, FE!N, FE!N, FE!N (Yeah)
FE!N, FE!N, FE!N, FE!N, FE!N
FE!N, FE!N (Yeah), FE!N, FE!N, FE!N

[Verse 1: Travis Scott & Sheck Wes]
The career's more at stake when you in your prime (At stake)
Fuck that paper, baby, my face on the dotted line (Dot, yeah)
I been flyin' out of town for some peace of mind (Yeah, yeah, bitch)
It's like always they just want a piece of mine (Ah)
I been focused on the future, never on right now (Ah)
What I'm sippin' not kombucha, either pink or brown (It's lit)
I'm the one that introduced you to the you right now (Mm, let's go)
Oh my God, that bitch bitin' (That bitch bitin')
Well, alright (Alright), tryna vibe (I'm tryna vibe this)
In the night, come alive
Ain't asleep, ain't a—, ain't a—, ain't-ain't

[Chorus: Travis Scott]
FE!N, FE!N, FE!N, FE!N, FE!N
FE!N, FE!N, FE!N, FE!N, FE!N
FE!N, FE!N, FE!N, FE!N, FE!N
FE!N, FE!N, FE!N, FE!N
FE!N, FE!N, FE!N, FE!N, FE!N
See Travis Scott Live
Get tickets as low as $248

You might also like
DELRESTO (ECHOES)
Beyoncé & Travis Scott
bad idea right?
Olivia Rodrigo
Used To Be Young
Miley Cyrus

[Bridge: Playboi Carti]
Schyeah, woah, what?
What?
(Homixide, Homixide, Homixide, Homixide)
What? (Yeah)
Woah, woah (Yeah, yeah)
(Homixide, Homixide, Homixide, Homixide)
Hit, yeah, hold up (Yeah)

[Verse 2: Playboi Carti]
Yeah, I just been poppin' my shit and gettin' it live, hold up (Shit)
Yeah, you try to come wrong 'bout this shit, we poppin' your tires, hold up (Shit)
Uh, hundred-round (Woah), feelin' like I'm on ten
Playin' both sides with these hoes (Hold up), shawty, I'm fuckin' your friend (Hold up)
I've been goin' crazy, shawty, I've been in the deep end
She not innocent, uh, she just tryna go

[Chorus: Travis Scott & Playboi Carti]
FE!N (Talkin' 'bout), FE!N, FE!N (Schyeah), FE!N, FE!N (Schyeah, oh, oh, what? Schyeah)
FE!N, FE!N (Schyeah), FE!N, FE!N, FE!N (Oh, oh)
FE!N, FE!N (Talkin' 'bout), FE!N, FE!N, FE!N, FE!N (Talkin' 'bout, let's go)

[Verse 3: Playboi Carti & Travis Scott]
I just been icin' my hoes, I just been drippin' my hoes (Drippin' my hoes)
This is a whole 'nother level, shawty (Oh), I got these hoes on they toes (Hoes on they toes)
I put the bitch on the road, she tryna fuck on the O, hold up, hold up
I got this ho with me, she tryna show me somethin', hold up, hold up (Oh)
I got flows for days, these niggas ain't on nothin', hold up, yeah (Oh)
Me and my boy locked in, you know we on one, hold up, uh (Slatt, slatt)
We in the spot goin' crazy until the sun up
You worried about that ho, that ho done chose up (Slatt, bitch-ass)
Uh, pistols all in the kitchen, can't give the zip code up, hold up, yeah, slatt (Wow)
FE!N, FE!N, FE!N (Huh? Huh? Huh? Huh? Yeah)
Why the fuck these niggas actin' like they know us?
00CACTUS, yeah, we towed up (Skrrt, skrrt), uh, yeah
Switch out the bag, these niggas get rolled up, hold up (It's lit), slatt
Everything hit, hold up, everything Homixide, Homixide (Homixide, Homixide, Homixide, Homixide)


[Outro: Travis Scott & Playboi Carti]
FE!N, FE!N, FE!N, FE!N, FE!N, FE!N (Homixide, Homixide, Homixide, Homixide, Homixide, Homixide, Homixide)`,
    },
    {
      title: "Space song",
      artist: "Beach House",
      audioURL: "../../src/assets/spacesong.mp3",
      cover: "../../src/assets/spacesong.webp",
      lyrics: `[Verse 1]
It was late at night
You held on tight
From an empty seat
A flash of light
It will take a while
To make you smile
Somewhere in these eyes
I'm on your side
You wide-eyed girls
You get it right

[Chorus]
Fall back into place
Fall back into place

[Verse 2]
Tender is the night
For a broken heart
Who will dry your eyes
When it falls apart?
What makes this fragile world go ’round?
Were you ever lost?
Was she ever found?
Somewhere in thеse eyes
See Beach House Live
Get tickets as low as $54

You might also like
Ghost in the Machine
SZA
Used
SZA
Blind
SZA

[Chorus]
Fall back into placе
Fall back into place
Fall back into place
Fall back into place
Fall back into place
Fall back into place
Fall back into place
Fall back into place
Fall back into place
Fall back into place
Fall back into place
Fall back into place
Fall back into place
Fall back in`,
    },
    {
      title: "If we being real",
      artist: "YEAT",
      audioURL: "../../src/assets/If we being real - YEAT.mp3",
      cover: "../../src/assets/ifwebeingreal.jpg",
      lyrics: `I had to let a little off, yeah
I had to cut the pill off, yeah
But if we bein' real though, yeah
Nah, I don't never feel nothin' (yeah, yeah)

I'm steady jumpin' the gun, yeah, I do it for fun
You act like you do it for real, but, no, you is not one of us
You never could come inside of this buildin' we run
Inside of this world we run, we do it for us
No, we don't fuck with one of them at all, at all
We don't fuck with you at all

No, I won't pick up your calls, uh
No, l don't like you at all
I kind of wanna see you fall
I keep on chasin' the highs, I know I could never get back
So I'm always on low
And I got eyes on the back of my head, I got eyes everywhere
So I know where you go (yeah, yeah)

I could drop ties in this bitch
Drop like flies in this bitch
I cut ties in this bitch
I'll cut ties in your face
Yeah, cut you like a lace
Nothin' I do could be replaced
That's why I'm livin' out in space

I take the money to another level
I take the plane to another level
I take the heights to a newer level
I take gettin' high to a newer level
Keep diggin' your grave, I'll pass you the shovel, yeah
I ain't mean to burst your bubble
But I ain't into makin' change, I'ma stay the same, bring it to my level

If we bein' real, I don't know how to feel
I been overseas (I been overseas), you been on your knees
You been beggin': Please (you been beggin', Please), it's nothin' left to see
It's nothin' left to feel, why you in the field? (Why you in the field?)
Why you so real? (Why you so real?)
Tell me how you feel, huh (tell me how you feel)
Why you make me feel the way I feel?
Will you make me feel better? (Will you make me feel better?)
Always clashin' heads, yeah
With somebody who think they know better (who think they know better)

Who the fuck is you? Got better things to do
I don't got time to waste, I just need my space
It's a couple things that I can feel, but I can't feel my face
It's a couple things that I wish I could, but I can't replace
I think it's a sickness, bein' so selfish, yeah
I'm in need of a witness
They always tell me, yeah, "Never forget this"
I forget everything, I don't even know where my tip is
And I'll change everything, I don't know how l'll top this`,
    },
    {
      title: "INVASION",
      artist: "Bleach OST",
      audioURL: "../../src/assets/Invasion.mp3",
      cover: "../../src/assets/invasion.jpg",
      lyrics: `[Chorus]
To every man there is a cause which he would gladly die for
Defend the right to have a place to which he can belong to
And every man will fight with his bare hands in desperation
And shed his blood to stem the flood, to barricade invasion

To every man there is a cause which he would gladly die for
Defend the right to have a place to which he can belong to
And every man will fight with his bare hands in desperation
And shed his blood to stem the flood, to barricade invasion

[Instrumental]

[Chorus]
To every man there is a cause which he would gladly die for
Defend the right to have a place to which he can belong to
And every man will fight with his bare hands in desperation
And shed his blood to stem the flood, to barricade invasion

To every man there is a cause which he would gladly die for
Defend the right to have a place to which he can belong to
And every man will fight with his bare hands in desperation
And shed his blood to stem the flood, to barricade invasion

To every man there is a cause which he would gladly die for
Defend the right to have a place to which he can belong to
And every man will fight with his bare hands in desperation
And shed his blood to stem the flood, to barricade invasion`,
    },
  ];
  useEffect(() => {
    setAudioFiles(defaultSongs);
  }, []);

  //Lyrics
  const [activeTab, setActiveTab] = React.useState("playlist");

  //Shortcuts
  useEffect(() => {
    const handleKeydown = (event) => {
      // Qo'shiq tanlanganmi, tekshirish
      if (currentSongIndex === null) {
        return; // Qo'shiq tanlanmagan bo'lsa, shortcutlarni ishlatish mumkin emas
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
    <div
      className="font- flex flex-col items-center min-h-screen"
      style={{
        background: colors.mainback,
      }}
    >
      {/* Music Image */}
      <div
        className="animate-slideIn2 p-3 fixed top-[15px] left-[300px] w-[430px] h-[430px] bg-white rounded-lg  mb-6"
        style={{
          animation: "slideIn2 0.5s ease-out ",
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
        className="animate-scaleIn flex h-[calc(100vh-600px)] fixed top-[460px] left-[300px] w-[430px]  rounded-lg  py-4 px-6 "
        style={{
          borderRadius: "14px",
          background: colors.background,
          color: colors.text,
          boxShadow: colors.cardShadow,
        }}
      >
        <div>
          <h2 className="text-2xl font-bold w-[200px]">
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
        className="animate-slideInRight  fixed top-[15px] right-[15px] h-[calc(100vh-155px)] w-[775px] ck rounded-lg shadow-custom p-4 overflow-hidden"
        style={{
          borderRadius: "14px",
          background: colors.background,
          color: colors.text,
          boxShadow: colors.cardShadow,
        }}
      >
        {/* Playlis/Lyrics Nav */}
        <div className="flex ml-3 gap-4 items-center mb-4 ">
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
        <div className="h-full   overflow-y-auto scrollbar-hidden px-3 py-3">
          {activeTab === "playlist" && (
            <div className="grid grid-cols-4 gap-4">
              {audioFiles.map((song, index) => (
                <div
                  key={index}
                  className={`p-2 relative group rounded-[14px] overflow-hidden shadow-md  ${
                    index === currentSongIndex
                      ? "animate-bounceUpDown"
                      : "border-transparent"
                  }`}
                  onClick={() => setCurrentSongIndex(index)}
                  style={{
                    background: colors.background,
                    color: colors.text,
                    boxShadow: colors.cardshadowl,
                    borderRadius: "px",
                  }}
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
                  ? audioFiles[currentSongIndex]?.lyrics
                      .split("\n\n")
                      .map((block, index) => (
                        <div key={index}>
                          {block.split("\n").map((line, lineIndex) => (
                            <p key={lineIndex}>{line}</p>
                          ))}
                          <br />
                        </div>
                      ))
                  : "No lyrics available."}
              </div>
            </div>
          )}

          {/* Choose file */}
          {activeTab === "playlist" && (
            <div className="mt-5 relative">
              <button
                onClick={() => document.getElementById("fileInput").click()}
                className="px-4 py-2 mt-20 text-white font-bold rounded-lg w-[717px]"
                style={{
                  background: colors.background,
                  color: colors.text,
                  boxShadow: colors.cardshadowsml,
                }}
              >
                Choose File
              </button>

              <input
                type="file"
                id="fileInput"
                accept="audio/*"
                onChange={handleFileChange}
                multiple
                className="hidden"
              />
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

          <div className="flex justify-between">
            {/* Playback speed */}
            <div className="flex items-center">
              <div className="relative">
                <MdOutlineSpeed
                  className="cursor-pointer text-black text-4xl rounded-full duration-300 mr-3"
                  onClick={toggleDropdown} 
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

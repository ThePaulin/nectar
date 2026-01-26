
import React, { useState, useRef, useEffect, type SetStateAction } from 'react';
import { DownloadIcon } from '~/libs/icons';
import { captureVideoThumbnail, getVideoDuration, isVideoPlaying } from '~/libs/utils';


type VideoObjType = {
  id: number;
  label: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
}



export default function RecorderComp(): void {
  const [recording, setRecording] = useState(false);
  const [videoUrls, setVideoUrls] = useState<VideoObjType[]>([]);
  const [timelineBlobs, setTimelineBlobs] = useState<Blobs[]>([]);
  const [finalTimelineBlob, setFinalTimelineBlob] = useState();
  const [timelineVideo, setTimelineVideo] = useState<string>();
  const [currentThumbnail, setCurrentThumbnail] = useState<string>();
  const [currentVideo, setCurrentVideo] = useState<VideoObjType>();
  const mediaRecorder = useRef(null);
  const videoChunks = useRef([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  // const videoCanva = useRef(null);

  // const videoCanva = document.getElementById("story-video-canvas");
  var imgSrc: string;

  // handle preview 
  useEffect(() => {
    async function startPreview() {

      const stream = await navigator.mediaDevices.getUserMedia(
        {
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false // This often fixes the fade-in
          },
          video: {
            width: 1920,
            height: 1080,
          }
        }
      );

      /* use the stream */
      const video = document.getElementById("video_preview");
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
      };

    }

    startPreview();

    // prevent page reload without confirmation to avoid video loss
    window.onbeforeunload = function() {
      // Returning any string will prompt the user with a confirmation dialog.
      // The specific text you return might not be displayed by modern browsers,
      // which show a generic "Are you sure you want to leave this page?" message.
      return "You have unsaved changes. Are you sure you want to leave?";
    };

    // add property to all html video tags to tell when a video is playing
    // Source - https://stackoverflow.com/a
    // Posted by Raees Iqbal, modified by community. See post 'Timeline' for change history
    // Retrieved 2026-01-24, License - CC BY-SA 3.0

    Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
      get: function() {
        return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
      }
    })



  }, [])

  useEffect(() => {
    setCurrentVideo(videoUrls[currentIndex]);
  }, [currentIndex])




  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia(
      {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false // This often fixes the fade-in
        },
        video: {
          width: 1920,
          height: 1080,
        }
      }
    );

    mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'video/mp4;codecs="avc1.640028"' });


    mediaRecorder.current.ondataavailable = (event) => {
      videoChunks.current.push(event.data);
    };

    mediaRecorder.current.onstop = async () => {
      const labelText: string = prompt("Enter clip name");

      const blob = new Blob(videoChunks.current, { type: 'video/mp4;codecs="avc1.640028"' });

      const img2 = await captureVideoThumbnail(URL.createObjectURL(blob));
      const videoLength = await getVideoDuration(blob);

      setCurrentThumbnail(img2);

      setVideoUrls(p => [...p, { id: p?.length ?? 0, label: labelText, thumbnailUrl: img2, videoUrl: URL.createObjectURL(blob), duration: videoLength }]);
      videoChunks.current = [];
    };

    mediaRecorder.current.start();
    setRecording(true);
  };



  const stopRecording = () => {
    mediaRecorder.current.stop();
    setRecording(false);
  };

  useEffect(() => {
    console.log(videoUrls, " videoUrls array");
    if (!currentIndex && videoUrls.length > 0) {
      setCurrentIndex(0); // initialize
    }
  }, [videoUrls]);

  // useEffect(() => {
  //   console.log("__currVideo: ", currentVideo?.videoUrl)
  // }, [currentVideo])


  useEffect(() => {
    // setFinalTimelineBlob(new Blob(timelineBlobs, {type: "video/mp4; codecs=avc1, aac"}));
    const finalBlob = new Blob(timelineBlobs, { type: 'video/mp4;codecs="avc1.640028"' });
    setTimelineVideo(URL.createObjectURL(finalBlob));

  }, [timelineBlobs])


  return (
    <div className='mt-4 px-4 flex flex-col items-center justify-center'>
      <div className='grid grid-cols-2'>
        <div className='w-full flex flex-col justify-around p-6'>
          {/* live feed */}
          <div className='relative'>
            <p className='absolute text-white border-4 animate-pulse border-red-400 m-2 px-4 py-2'>LIVE</p>
            <video id='video_preview' className='w-full' muted />
          </div>
          {/* recording controls */}
          <div className='p-6 w-1/2`'>
            <button
              className={`p-2 border border-black-20 ${recording ? 'bg-red-400' : ''}`}
              onClick={recording ? stopRecording : startRecording}
            >
              <span className={`font-bold ${recording ? 'animate-pulse' : ''}`}>
                {recording ? 'Stop Recording' : 'Start Recording'}
              </span>
            </button>

          </div>
        </div>
        {videoUrls?.length > 0 ? (

          <div className='w-full h-fit p-6 flex justify-around items-start relative'>
            {/* timeline preview */}
            {/* <video src={timelineVideo} className='w-[800px]' controls /> */}
            <div
              className='absolute z-10 top-1/2 px-10  w-full flex justify-between'
            >
              <button
                aria-label='previous clip'
                className='text-white disabled:text-red-400 disabled:cursor-not-allowed cursor-pointer'
                onClick={() => setCurrentIndex(p => p - 1)}
                disabled={videoUrls?.length <= 1 || currentIndex - 1 < 0}

              >
                PREV
              </button>
              <button
                aria-label='next clip'
                className='text-white disabled:text-red-400 disabled:cursor-not-allowed cursor-pointer'
                onClick={() => setCurrentIndex(p => p + 1)}
                disabled={videoUrls?.length <= 1 || currentIndex + 1 >= videoUrls?.length}


              >
                NEXT
              </button>
            </div>
            {/* 
                            <video id="timelinePlayBack" className='w-full duration-[500]' src={videoUrls[currentIndex]?.videoUrl} autoPlay />

              */}
            {
              videoUrls?.map((vid, idx) => {
                const videoStatus = idx === currentIndex ? 'playing' : 'idle';
                const videoStyles = {
                  playing: 'block',
                  idle: 'hidden',
                }
                return (
                  <video key={vid.id} id={`timelinePlayBack_${idx}`} className={`w-full duration-[500] ${videoStyles[videoStatus]} `
                  } src={vid?.videoUrl} autoPlay />

                )
              })
            }
          </div>
        ) : null}
      </div>
      <div>
        {/* video timeline */}
        {videoUrls?.length > 0 ? <Timeline clips={videoUrls} playingIndex={currentIndex} setPlayingIndex={setCurrentIndex} /> : null}
      </div>
      <canvas id="story-video-canvas" style={{ display: "none" }} ></canvas>
    </div >
  );

}



function Timeline({ clips, playingIndex, setPlayingIndex }: { clips: VideoObjType[]; playingIndex: number; setPlayingIndex: SetStateAction<number> }) {
  console.log("clips: ", clips);

  const [indexTracker, setIndexTracker] = useState(playingIndex);

  useEffect(() => {
    setIndexTracker(playingIndex);

    // get the new video element and play it
    const currVideoEl = document.getElementById(`timelinePlayBack_${playingIndex}`);
    currVideoEl.play();


  }, [playingIndex])


  return (
    <div className='relative'>
      <div className='fixed h-[150px] border border-red-400 text-red-400 top-1/2 left-1/2 -translate-x-1/2 z-10' />
      <div id="video_clips_container" className="w-[90vw]  border border-black/80 mx-auto overflow-x-scroll flex justify-center items-center">
        <div className='flex justify-start items-center flex-row w-[1000px] translate-x-1/2'>
          {
            clips.length > 0 && clips?.map(({ videoUrl, id, label, thumbnailUrl, duration }, index) => {
              const date = new Date(null);
              date.setSeconds(duration);
              const durationTime = date.toISOString().slice(11, 19);
              const clipSize = `${Math.round((duration / 1200) * 240 * 100)}px`;

              const playStatus: 'playing' | 'idle' | 'paused' = playingIndex === index ? 'playing' : 'idle';
              const clipStatusStyles = {
                playing: 'border border-red-400 ',
                idle: 'border border-white'
              }
              const downloadStatusStyle = {
                downloaded: 'bg-green-400',
                todownload: 'bg-none'
              };
              // const [clipDownloadStatus, setClipDownloadStatus] = useState<'downloaded' | 'todownload'>('todownload');
              let clipDownloadStatus = 'todownload';



              return (
                <article key={thumbnailUrl}
                  onClick={() => {
                    if (playStatus === 'playing') {
                      const videoPlayer = document.getElementById(`timelinePlayBack_${index}`);
                      const isPlaying = isVideoPlaying(videoPlayer);

                      if (videoPlayer && isPlaying) {
                        videoPlayer.pause();
                        // videoPlayer.currentTime = 0;
                        // videoPlayer?.play();
                        // playStatus = 'idle';
                        setPlayingIndex(indexTracker);
                      } else {

                        videoPlayer.play()
                      }

                    } else {
                      setPlayingIndex(index);
                    }
                  }}
                  className={`${clipStatusStyles[playStatus]} bg-gradient-to-r from-cyan-500 to-blue-500  flex flex-col justify-start`}
                // style={{
                //   minWidth: clipSize,
                //   border: {`2px ${playingIndex === index ? 'solid red' : 'solid white'`}
                // }}>
                >
                  <div className='flex justify-around  items-center bg-black'>
                    <p className='text-xs bottom-0 left-0 p-1 text-white/80 flex flex-col items-start'>
                      <span>{label}</span>
                      <span>{durationTime}</span>
                    </p>
                    <button
                      className="rounded-full cursor-pointer size-[25px] overflow-clip"
                      onClick={(e) => {
                        // handle download
                        // setClipDownloadStatus = 'downloaded'

                        const link = document.createElement("a");
                        link.href = videoUrl;
                        link.download = `${index + 1}_` + label;
                        link.click();
                        const downloadIcon = document.getElementById(`downloadBtnIcon${index}`);
                        downloadIcon?.setAttribute('fill', '#90EE90');

                      }}>
                      <div className='p-1'>
                        <DownloadIcon className={`rounded-full pointer-events-none`} index={index} />
                      </div>
                    </button>

                  </div>

                  <img src={thumbnailUrl} alt={label} width={48} height={27} className='object-contain min-w-[112px] ' />
                </article>
              )
            })
          }
        </div>

      </div>
    </div >
  )

}




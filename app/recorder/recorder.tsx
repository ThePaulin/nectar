
import { useEffect, useState } from "react";

type ClipType = { videoSrc: string; imgSrc: string; label: string; id: string };

async function getVideoDuration(blob) {
  return new Promise((resolve) => {
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);
    const video = document.createElement('video');

    // Listen for metadata to be loaded
    video.onloadedmetadata = () => {
      // Free memory by revoking the object URL
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };

    video.src = url;
    video.load(); // Forces the browser to fetch the metadata
  });
}


async function captureImageFromVideoBlob(videoBlob, timeInSeconds) {
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  // 1. Load the video blob
  video.src = URL.createObjectURL(videoBlob);

  return new Promise((resolve) => {
    video.onloadeddata = () => {
      // 2. Seek to the desired timestamp
      video.currentTime = timeInSeconds;
    };

    video.onseeked = () => {
      // 3. Draw the current frame to canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 4. Convert canvas to an image (Blob)
      canvas.toBlob((blob) => {
        const imageUrl = URL.createObjectURL(blob);
        resolve(imageUrl); // Returns a URL you can use in an <img> tag
      }, 'image/jpeg');
    };
  });
}

export function Recorder(params: type) {

  const [mutePreview, setMutePreview] = useState<boolean>();
  const [videoBlobsArr, setVideoBlobsArr] = useState<Blob[]>([]);
  const [fullTimelineBlob, setFullTimelineBlob] = useState<Blob | undefined>();
  const [fullTimelineSrc, setFullTimelineSrc] = useState<MediaSource>();
  const [vidUrls, setVidUrls] = useState([]);
  const [clips, setClips] = useState<ClipType[]>([]);

  const [recorder, setRecorder] = useState();

  let mediaRecorder;
  let thumbnailCapture;
  let currentClipThumbnail;
  let chunks = [];
  let timelineChunks = [];
  let isFirstChunk = true;
  // let videoBlobsArr = [];
  //
  let imgSrc: String = '';


  function initRecorder() {
    window.navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false // This often fixes the fade-in
      },
      video: {
        width: 1920,
        height: 1080,

      }
    })
      .then((stream) => {
        /* use the stream */
        const video = document.getElementById("video_preview");
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
        };

        mediaRecorder = new MediaRecorder(stream);

        const track = stream.getVideoTracks()[0];
        thumbnailCapture = new ImageCapture(track);


        // handle ondataavailable, populate chunks
        mediaRecorder.ondataavailable = (e) => {
          chunks.push(e.data);
          //  if (e.data && e.data.size > 0) {
          //   if (isFirstChunk) {
          //     // Discard the first chunk (the "fade-in" period)
          //     console.log("Discarding initial fade-in chunk...");
          //     isFirstChunk = false;
          //   } else {
          //   // Keep all subsequent chunks
          //   chunks.push(e.data);
          //   }
          // }
          timelineChunks.push(e.data);
        };

        // handle onstop
        mediaRecorder.onstop = (e) => {

          const startBtn = document.getElementById("startRecordingBtn");

          // prompt to name clip
          const clipName = prompt("Enter a name for your video clip");
          const videoClipContainer = document.getElementById("video_clips_container");

          const clipContainer = document.createElement("article");
          const clipLabel = document.createElement("p");
          const video = document.createElement("video");
          const vidPrevImgCanvas = document.createElement("canvas");
          const vidThumbnail = document.createElement("img");
          const deleteButton = document.createElement("button");

          const timelinePreview = document.getElementById("timeline_preview");

          //
          video.setAttribute("controls", "");
          deleteButton.textContent = "Delete";
          clipLabel.textContent = clipName;
          vidPrevImgCanvas.width = "240";
          vidPrevImgCanvas.height = "135";
          vidThumbnail.width = "240";
          vidThumbnail.height = "135";



          // clipContainer.appendChild(video);

          clipContainer.appendChild(vidPrevImgCanvas);
          clipContainer.appendChild(vidThumbnail);
          clipContainer.appendChild(clipLabel);
          clipContainer.appendChild(deleteButton);

          videoClipContainer.appendChild(clipContainer);

          const blob = new Blob(chunks, { type: "video/mp4; codecs=avc1, aac" });
          captureImageFromVideoBlob(blob, 1)
            .then((imgURL) => {
              console.log("imgURL: ", imgURL);
              vidThumbnail.src = imgURL;
              // imgSrc = imgURL;
            })
            .catch((err) => {
              console.log("not imgURL err: ", err);
            });

          // console.log("imgURLCaptured: ", imgURLCaptured);

          // const timelineBlob = new Blob(timelineChunks, { type: "video/mp4; codecs=avc1, aac" });
          chunks = [];

          console.log("blob: ", blob);

          // add blob to blobs array
          // videoBlobsArr.push(blob); 
          setVideoBlobsArr(p => [...p, blob]);
          //
          const videoURL = window?.URL?.createObjectURL(blob);
          video.src = videoURL;
          //
          setVidUrls(p => [...p, videoURL]);
          setClips(p => [...p, { id: p.length ?? 0, imgSrc, label: clipName, videoSrc: videoURL }])

          // const timelineURL = window?.URL?.createObjectURL(timelineBlob);
          // timelinePreview.src = timelineURL;
          //

          // draw on canvas
          // drawCanvas(vidPrevImgCanvas, currentClipThumbnail);

          deleteButton.onclick = (e) => {
            let evtTgt = e.target;
            evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
          };

          console.log(mediaRecorder)


          mediaRecorder.start();

        }
      })
      .catch((err) => {
        /* handle the error */
        console.log("You messed up: ", err)
      });


  }

  useEffect(() => {

    initRecorder();
    // 
    //    window.navigator.mediaDevices.getUserMedia({
    //      audio: true,
    //      video: {
    //        width: 1920,
    //        height: 1080,
    //
    //      }
    //    })
    //  .then((stream) => {
    //    /* use the stream */
    //    const video = document.getElementById("video_preview");
    //    video.srcObject = stream;
    //    video.onloadedmetadata = () => {
    //      video.play();
    //    };
    //
    //    mediaRecorder = new MediaRecorder(stream);
    //
    //    const track = stream.getVideoTracks()[0];
    //    thumbnailCapture = new ImageCapture(track);
    //
    //
    //    // handle ondataavailable, populate chunks
    //    mediaRecorder.ondataavailable = (e) => {
    //      chunks.push(e.data);
    //      timelineChunks.push(e.data);
    //    };
    //
    //    // handle onstop
    //    mediaRecorder.onstop = (e) => {
    //
    //
    //      // prompt to name clip
    //      const clipName = prompt("Enter a name for your video clip");
    //      const videoClipContainer = document.getElementById("video_clips_container");
    //
    //      const clipContainer = document.createElement("article");
    //      const clipLabel = document.createElement("p");
    //      const video = document.createElement("video");
    //      const vidPrevImgCanvas = document.createElement("canvas");
    //      const deleteButton = document.createElement("button");
    //
    //      const timelinePreview = document.getElementById("timeline_preview");
    //
    //
    //      video.setAttribute("controls", "");
    //      deleteButton.textContent = "Delete";
    //      clipLabel.textContent = clipName;
    //      vidPrevImgCanvas.width = "240";
    //      vidPrevImgCanvas.height = "135";
    //
    //      // clipContainer.appendChild(video);
    //
    //      clipContainer.appendChild(vidPrevImgCanvas);
    //      clipContainer.appendChild(clipLabel);
    //      clipContainer.appendChild(deleteButton);
    //
    //      videoClipContainer.appendChild(clipContainer);
    //
    //      const blob = new Blob(chunks, { type: "video/mp4; codecs=avc1, aac" });
    //      // const timelineBlob = new Blob(timelineChunks, { type: "video/mp4; codecs=avc1, aac" });
    //      chunks = [];
    //
    //      console.log("blob: ", blob);
    //
    //      // add blob to blobs array
    //      // videoBlobsArr.push(blob); 
    //      setVideoBlobsArr(p => [...p, blob]);
    //
    //      const videoURL = window?.URL?.createObjectURL(blob);
    //      video.src = videoURL;
    //
    //      setVidUrls(p => [...p, blob]);
    //
    //      // const timelineURL = window?.URL?.createObjectURL(timelineBlob);
    //      // timelinePreview.src = timelineURL;
    //      //
    //
    //      // draw on canvas
    //       drawCanvas(vidPrevImgCanvas, currentClipThumbnail);
    //
    //      deleteButton.onclick = (e) => {
    //        let evtTgt = e.target;
    //        evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
    //      };
    //
    //      console.log(mediaRecorder)
    //
    //
    //
    //
    //    }
    // })
    //  .catch((err) => {
    //    /* handle the error */
    //    console.log("You messed up: ", err)
    //  });
  }
    , []);

  // useEffect(()=> {
  //
  //   if(videoBlobsArr.length > 0) {
  //     setFullTimelineBlob(new Blob(videoBlobsArr, { type: "video/mp4; codecs=avc1, aac" }));
  //     // setFullTimelineBlob(videoBlobsArr?.reduce((a, b)=> new Blob([a, b], {type: "video/mp4; codecs=avc1, aac"})))
  //     console.log("blobsArr: ", videoBlobsArr);
  //   }
  // }, [videoBlobsArr]); 

  // useEffect(() => {
  //
  //   if(typeof window !== 'undefined' && window.URL && fullTimelineBlob) {
  //   console.log("__fullTimelineBlob: ", fullTimelineBlob);
  //
  //   const timelinePreview = document.getElementById("timeline_preview");
  //
  //   timelinePreview.src = window?.URL?.createObjectURL(fullTimelineBlob);
  //   // setFullTimelineSrc(window?.URL?.createObjectURL(fullTimelineBlob));
  //   }
  //
  // }, [fullTimelineBlob])

  function startRecording(mediaRecorder) {
    if (!mediaRecorder) {
      initRecorder();
    }

    try {
      mediaRecorder?.start();
      // capture thumbnail
      // thumbnailCapture
      // .takePhoto()
      // .then((blob) => createImageBitmap(blob))
      // .then((imageBitmap) => {
      //   currentClipThumbnail = imageBitmap;
      //
      //   console.log("__CurrBitmap: ", currentClipThumbnail)
      // })
      console.log(mediaRecorder.state);
      console.log("recorder started");
    } catch (e) {
      console.log("could not start recording: ", e);
    }
  }

  function stopRecording(mediaRecorder) {
    if (mediaRecorder) {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
    } else {
      console.log("could not stop recording")
    }
  }


  function drawCanvas(canvas, img) {
    canvas.width = getComputedStyle(canvas).width.split("px")[0];
    canvas.height = getComputedStyle(canvas).height.split("px")[0];
    let ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
    let x = (canvas.width - img.width * ratio) / 2;
    let y = (canvas.height - img.height * ratio) / 2;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    canvas
      .getContext("2d")
      .drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        x,
        y,
        img.width * ratio,
        img.height * ratio,
      );
  }

  return (
    <div>
      <div className="flex justify-center items-center">

        <h2>Live</h2>
        {/* camva will be here*/}
        <div className="w-full flex flex-row justify-start items-center">
          <div className="flex flex-col justify-center items-center">
            <video id="video_preview" width="304" height="304" muted={mutePreview} />
            <div>
              <button onClick={() => setMutePreview(prev => !prev)} className={`${mutePreview ? 'bg-red-400' : 'bg-green-400'}`}>Mute/Unmute</button>
            </div>
          </div>
        </div>
        <button id="startRecordingBtn" className="bg-red-400 cursor-pointer"
          onClick={() => startRecording(mediaRecorder)}
        >Start Recording</button>
        <button id="stopRecordingBtn" className="bg-blue-400 cursor-pointer"
          onClick={() => stopRecording(mediaRecorder)}
        >Stop Recording</button>
        <div>
          <div>
            {/* preview*/}
            <h2>Preview timeline</h2>
            <div>
              <video id="timeline_preview" controls />
            </div>
          </div>
        </div>
      </div>
      <div id="video_clips_container" className="w-[90%] mx-auto overflow-x-scroll flex flex-row mt-12">

      </div>
      {/* <Timeline clips={clips} videoBlobsArr={videoBlobsArr} /> */}

    </div>
  );
}

function Timeline({ clips, videoBlobsArr }: { clips: ClipType[], videoBlobsArr: any[] }) {
  console.log("clips: ", clips);


  return (
    <div id="video_clips_container" className="w-[90%] mx-auto overflow-x-scroll flex flex-row mt-12">
      {
        clips?.map(({ videoSrc, imgSrc, label, id }: ClipType, index: number) => {
          let imgSRC;
          captureImageFromVideoBlob(videoBlobsArr[index], 1)
            .then((imgURL) => {
              console.log("imgURL: ", imgURL);
              // vidThumbnail.src = imgURL;
              imgSRC = imgURL;
            })
            .catch((err) => {
              console.log("not imgURL err: ", err);
            });

          return (
            <article>
              <>TEST</>
              <p>{label}</p>
              <img src={imgSRC} alt={label} width={240} height={135} />
            </article>
          )
        })
      }


    </div>
  )

}


export async function getVideoDuration(blob) {
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


/**
 * Captures a video thumbnail as a Base64-encoded image.
 * @param {string} videoUrl - Path to the video to be converted.
 * @returns {Promise<string>} - A Promise that resolves with the thumbnail's Base64 URL.
 */
export function captureVideoThumbnail(videoUrl) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    // const canvas = document.createElement("canvas");

    const canvas = document.getElementById("story-video-canvas");
    const context = canvas.getContext("2d");

    // Set attributes to assist with loading
    video.setAttribute("crossorigin", "anonymous");
    video.preload = "metadata";

    // Wait for metadata to load
    video.addEventListener("loadeddata", () => {
      video.currentTime = 100; // Go to a specific time (e.g., 100ms)
    });

    // Capture frame once seeking is complete
    video.addEventListener("seeked", () => {
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Generate thumbnail as Base64 URL
        const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);

        // Clean up
        video.pause();
        video.removeAttribute("src");
        video.load();

        resolve(thumbnailUrl);
      } catch (error) {
        reject(new Error(`Failed to capture thumbnail: ${error.message}`));
      }
    });

    // Handle video loading errors
    video.addEventListener("error", (e) => reject(e));

    video.src = videoUrl; // Assign video URL
    video.load();         // Start loading the video
  });
}


export const isVideoPlaying = (videoPlayer: HTMLVideoElement): boolean => !!(videoPlayer.currentTime > 0 && !videoPlayer.paused && !videoPlayer.ended && videoPlayer.readyState > 2);


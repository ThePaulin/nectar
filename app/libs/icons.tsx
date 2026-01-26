
export const DownloadIcon = (props) => (
  <svg
    fill={props.fill ?? "#FFF"}
    // height="15px"
    // width="15px"
    id={`downloadBtnIcon${props.index}`}
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 24 24"
    xmlSpace="preserve"
  // {...props}
  >
    <g id="download">
      <g>
        <path d="M24,24H0v-8h2v6h20v-6h2V24z M12,18.4l-7.7-7.7l1.4-1.4l5.3,5.3V0h2v14.6l5.3-5.3l1.4,1.4L12,18.4z" />
      </g>
    </g>
  </svg>
);


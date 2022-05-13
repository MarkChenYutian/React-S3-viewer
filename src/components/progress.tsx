import { Progress } from "antd";
import { fileSizeConvert } from "./fileEntry";

export default function DownloadProgress(props: any) {
  if (props.allSize === 0) return null;
  const percent = parseFloat((props.currSize/props.allSize).toFixed(4));
  return (
    <>
      <h3>Download Progress</h3>
      <Progress
        percent={percent * 100}
        status="active"
        format={(percent, successPercent) => {
          return percent?.toFixed(2) + "% | " + fileSizeConvert(props.currSize) + "/" + fileSizeConvert(props.allSize);
        }}
        strokeColor="#ff5100"
        // trailColor="transparent"
      />
      <hr/>
    </>
  )
}

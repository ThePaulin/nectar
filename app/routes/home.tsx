import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { Recorder } from "../recorder/recorder.tsx";
import RecorderComp from "~/recorder/RecorderComp";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (<>
    <RecorderComp />
    {/*<Recorder /> */}
    {/* <Welcome /> */}

  </>);
}

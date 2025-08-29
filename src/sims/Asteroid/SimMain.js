import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from "react";

import { Titlebar } from '../../ui/Titlebar';
import { AsteroidSimInfo } from './SimInfo';
import { AsteroidSimulation } from './SimUtils';
import { CameraPage } from './Camera';
import { PlayPage } from './Play';

import CameraBtn from '../../images/camera-btn.svg';
import PlayBtn from '../../images/play-btn.svg';

let simData = new AsteroidSimulation();

export default function AsteroidSim() {
    const [pageState, setPageState] = useState("home");
    simData.updateState("home");

    const [selectedCameraId, setSelectedCameraId] = useState("");
    const [devices, setDevices] = useState([]);

    useEffect(() => {
        const setupDevices = setTimeout(async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());

                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === "videoinput");
                setDevices(videoDevices);

                // Set default camera to the first device
                if (videoInputs.length > 0) {
                    // Keep the current selected camera if it's still available
                    const currentSelectedDeviceStillExists = videoInputs.some(
                        device => device.deviceId === selectedCameraId
                    );
                    if (selectedCameraId && currentSelectedDeviceStillExists) {
                        setSelectedCameraId(selectedCameraId);
                    } else {
                        // Otherwise, set the first available as default
                        setSelectedCameraId(videoInputs[0].deviceId);
                    }
                }
            } catch (err) {
                console.error("Error accessing devices: ", err);
            }
        }, 500);

        return () => clearTimeout(setupDevices);
    }, []);

    if (pageState === "home") {
        console.log("[pageState] home");
        simData.updateState("home");
        return (
            <div className="App">
                <Titlebar />
                <div className="Home">
                    <AsteroidSimInfo />
                    <CapturePreview setState={setPageState} simData={simData}/>
                </div>
                <Bottombar onClick={() => setPageState("play")} />
            </div>
        )
    } 
    else if (pageState === "bg-camera") {
        console.log("[pageState] bg-camera");
        simData.updateState("bg-camera");
        return (
            <div className="App">
                <Titlebar /> 
                <CameraPage setState={setPageState} simData={simData} selectedCameraId={selectedCameraId} setSelectedCameraId={setSelectedCameraId} cameraDevices={devices}/>
            </div>
        )
    } 
    else if (pageState === "obj-camera") {
        console.log("[pageState] obj-camera");
        simData.updateState("obj-camera");
        return (
            <div className="App">
                <Titlebar /> 
                <CameraPage setState={setPageState} simData={simData} selectedCameraId={selectedCameraId} setSelectedCameraId={setSelectedCameraId} cameraDevices={devices}/>
            </div>
        )
    } 
    else if (pageState === "play") {
        console.log("[pageState] play");
        simData.updateState("play");
        return (
            <div className="App">
                <Titlebar />
                <PlayPage setState={setPageState} simData={simData}/>
            </div>
        )
    }
}

function CapturePreview({setState, simData}) {
    const bgCanvasRef = useRef(null);
    const objCanvasRef = useRef(null);

    // let bgCapture = simData.getBackgroundImg();

    useEffect(() => {
        const bgCanvas = bgCanvasRef.current;
        simData.previewBackground(bgCanvas, 480, 320);

        const objCanvas = objCanvasRef.current;
        simData.previewObjects(objCanvas, 480, 320);
    }, []);

    return (
        <div className="PreviewPane">
            <div className="PreviewItem">
                <h4>Background</h4>
                <div className="CapturePreview">
                    <canvas 
                        ref={bgCanvasRef}
                        width={480}
                        height={320} />
                    <img 
                        className="CameraBtn"
                        src={CameraBtn}
                        alt="Camera Button"
                        onClick={() => setState("bg-camera") }
                    />
                </div>
            </div>
            <div className="PreviewItem">
                <h4>Objects</h4>
                <div className="CapturePreview">
                    <canvas 
                        ref={objCanvasRef}
                        width={480}
                        height={320} />
                    <img 
                        className="CameraBtn"
                        src={CameraBtn}
                        alt="Camera Button"
                        onClick={() => setState("obj-camera")}
                    />
                </div>
            </div>
        </div>
    )
}

function Bottombar({onClick}) {
    return (
        <div className="Bottombar">
            <img 
                className="PlayBtn"
                src={PlayBtn}
                alt="Play Button"
                onClick={() => {onClick()}}
            />
        </div>
    )
}

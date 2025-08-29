import Webcam from "react-webcam";
import { useState, useRef, useCallback, useEffect } from "react";

import { findMarkers, flattenFrame } from "../../utils/CVUtils";
import { AsteroidSimulation } from "./SimUtils";

import { BottombarCapture } from "../../ui/Bottombar";

import CheckImg from "../../images/check-mark.svg";
import CaptureBtn from "../../images/capture-btn.svg";
import BackBtn from "../../images/back-btn.svg";

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

// const VideoConstraints = {
//     width: 1080,
//     height: 720,
//     // facingMode: { exact: "environment" }
//     deviceId: "128849aa6d8fc61174b05c1d415cd982031daa69703c92d872b4dd325014aa6f"
// };
  
export function CameraPage({setState, simData, selectedCameraId, setSelectedCameraId, cameraDevices}) {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);

    const [validFrame, setValidFrame] = useState(false);
    // const [lastValidTime, setLastValidTime] = useState(Date.now() % 100000);

    // set lastValidTime to -2000 to ensure frame is false on load
    let lastValidTime = -2000;

    // const [selectedCameraId, setSelectedCameraId] = useState("");
    
    const processFrame = useCallback(() => {
        if (webcamRef == null) {
            console.log("Not declared yet");
            return;
        }

        const video = webcamRef.current.video;
        const canvas = canvasRef.current;

        if (video && canvas) {
            let startTime = performance.now();

            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const img = cv.matFromImageData(frame);
            // const gray = new cv.Mat();
            // cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY);

            let markers = new Map();
            let markersFound = false;
            if (simData.getState() === "bg-camera") 
                markersFound = simData.checkBgMarkers(img, markers);
            else if (simData.getState() === "obj-camera")
                markersFound = simData.checkObjMarkers(img, markers);

            let endTime = performance.now();
            // console.log(`Detection time: ${endTime - startTime}`);

            if (markersFound) {
                lastValidTime = performance.now();
                // setLastValidTime(Date.now() % 100000);
                
                setValidFrame(true);
            } 
            // Stop camera flicker by resetting every 2s -- currently commented cuz doesn't work
            else {
                // if (Date.now() > lastValidTime + 2000) {
                if (performance.now() - lastValidTime > 2000) {
                    setValidFrame(false);
                }
                else {
                    setValidFrame(true);
                }
            }
            // console.log(lastValidTime);

            img.delete();
            // gray.delete();
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(processFrame, 30);
        return () => clearInterval(interval);
    }, [processFrame]);

    const captureFrame = useCallback(() => {
        console.log("Capturing frame");

        // Take the last valid captured image and flatten it
        // Add background and objects based on the capture mode\
        if (simData.getState() === "bg-camera")
            simData.addBackground();
        else if (simData.getState() === "obj-camera")
            simData.addObjects();

        setState("home");
    }, []);
    
    return (
        <div className="CameraPage">
            <Webcam 
                className="Webcam"
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                    width: 1080,
                    height: 720,
                    deviceId: selectedCameraId
                }} 
                ref={webcamRef}
            />
            <canvas 
                ref={canvasRef}
                width={1080}
                height={720}
                style={{display: "none"}}
            />
            <CameraCheck check={validFrame} />
            <Bottombar onClick={() => {captureFrame()}} onBack={() => {setState("home")}} valid={validFrame} camera={selectedCameraId} setCamera={setSelectedCameraId} devices={cameraDevices}/>
        </div>
    )
}

function Bottombar({onClick, onBack, valid, camera, setCamera, devices}) {
    // const [devices, setDevices] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(camera);

    const sxFont = {fontFamily: 'Poppins', fontSize: '14px', color: '#fafafa'};
    
    // useEffect(() => {
    //     const getDevices = setTimeout(async () => {
    //         try {
    //             const devices = await navigator.mediaDevices.enumerateDevices();
    //             const videoDevices = devices.filter(device => device.kind === "videoinput");
    //             setDevices(videoDevices);

    //             // Set default camera to the first device
    //             if (videoDevices.length > 0) {
    //                 setCamera(videoDevices[0].deviceId);
    //                 setSelectedCamera(videoDevices[0].deviceId);
    //             }
    //         } catch (err) {
    //             console.error("Error accessing devices: ", err);
    //         }
    //     }, 3000);

    //     return () => clearTimeout(getDevices);
    // }, []);

    const handleDeviceChange = (event) => {
        console.log(`Setting camera to: ${event.target.value}`);
        setCamera(event.target.value); 
        setSelectedCamera(event.target.value);
    }

    const cameraList = devices.length > 0 ? devices.map((dev) => 
        <MenuItem key={dev.deviceId} value={dev.deviceId} sx={sxFont}>{dev.label}</MenuItem>) : 
        (<MenuItem disabled sx={sxFont}>Loading...</MenuItem>)

    return (
        <div className="Bottombar">
            <img 
                className="BackBtn"
                src={BackBtn}
                alt="Back Button"
                onClick={() => {onBack()}}
            />
            <div className="BottomOptions">
                <FormControl sx={{ minWidth: '80px', maxWidth: '120px', maxHeight: '40px', fontSize: '14px' }}>
                    <InputLabel sx={sxFont}>Camera</InputLabel>
                    <Select
                        value={selectedCamera}
                        onChange={handleDeviceChange}
                        autoWidth
                        label="Camera"
                        sx={{
                            '.MuiOutlinedInput-notchedOutline': { borderColor: '#6f6f6f' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6f6f6f' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6f6f6f' },
                            '.MuiSelect-icon': { color: '#fafafa' },
                            color: '#fafafa',
                            maxHeight: '40px',
                            ...sxFont}}
                        MenuProps={{
                            PaperProps: {
                                sx: {
                                    backgroundColor: '#2c2c2c',
                                    color: '#fafafa',
                                    fontFamily: 'Poppins',
                                    fontSize: '12px'
                                },
                            },
                        }}
                    >
                        {cameraList}
                    </Select>
                </FormControl>
            </div>
            {valid ? 
                <img 
                    className="CaptureBtn"
                    src={CaptureBtn}
                    alt="Capture Button"
                    onClick={() => {onClick()}}
                    style={{opacity: "1.0"}}
                /> : 
                <img 
                    className="CaptureBtn"
                    src={CaptureBtn}
                    alt="Capture Button"
                    onClick={() => {}}
                    style={{opacity: "0.2"}}
                />
            }
        </div>
    )
}

function CameraCheck({check}) {
    return (
        <>
            {check ? <img 
                className="CheckImg"
                src={CheckImg}
                alt="Checkmark"
            /> : null } 
        </>
    )
}


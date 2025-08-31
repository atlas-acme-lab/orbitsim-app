import { useCallback, useEffect, useRef, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import Whammy from "react-whammy";

import BackBtn from "../../images/back-btn.svg";
import StopBtn from "../../images/stop-btn.svg";
import StopBtnMobile from "../../images/stop-btn-mobile.svg";
import PlayBtn from "../../images/play-btn.svg";
import PlayBtnMobile from "../../images/play-btn-mobile.svg";
import DownloadBtn from "../../images/download-btn.svg";
import DownloadBtnMobile from "../../images/download-btn-mobile.svg";
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from "@mui/material/CircularProgress";

export function PlayPage({setState, simData}) {
    const canvasRef = useRef(null);
    const [playCanvas, setPlayCanvas] = useState(null);
    const [playing, setPlaying] = useState(null);

    // state for orbit toggle
    const [checked, setChecked] = useState(true);

    // Variables for recording
    const mediaRecorderRef = useRef(null);
    const recordedChunks = useRef([]);
    const [recording, setRecording] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState("");
    const [recordingError, setRecordingError] = useState(null);

    useEffect(() => {
        return () => {
            if (downloadUrl) {
                URL.revokeObjectURL(downloadUrl);
            }
        };
    }, [downloadUrl]);

    const playAnimation = (frameCount) => { 
        console.log(typeof(playCanvas));
        simData.animateOrbit(playCanvas, frameCount, 1080, 720, checked);
    }

    const downloadAnimationNative = useCallback(async () => {
        if (recording) return;
        setRecording(true);

        const stream = playCanvas.captureStream(20); // 20 FPS
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/mp4' });
        mediaRecorderRef.current = mediaRecorder;

        recordedChunks.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.current.push(event.data);
            }
        };

        // Handle stopping of recording
        mediaRecorder.onstop = () => {
            console.log("Recording stopped, processing video...");
            const blob = new Blob(recordedChunks.current, { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
            setRecording(false);
            recordedChunks.current = [];

            // Trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = 'animation.mp4';
            a.click();

            URL.revokeObjectURL(url);
            setRecording(false);
        };

        // Start recording
        mediaRecorder.start();
        setRecording(true);
        console.log("Recording started");

        // Stop recording after 10 seconds
        const duration = 10000;
        setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === "recording") {
                mediaRecorder.stop();
                console.log("Recording stopped");
            }
        }, duration);

    }, [playCanvas, recording]);

    const downloadAnimation = () => {
        if (recording) return;
        setRecording(true);

        const duration = 10000; // 10 seconds
        const fps = 20;
        const frameInterval = 1000 / fps;
        const totalFrames = Math.round((duration / 1000) * fps);

        let currentFrame = 0;

        const encoder = new Whammy.Video(fps); // 20 FPS

        let startTime = performance.now();

        const captureFrame = () => {
            const elapsed = performance.now() - startTime;
            // Capture current frame
            encoder.add(playCanvas);
            currentFrame++;
            // console.log('Capturing frame');

            if (currentFrame < totalFrames) {
                setTimeout(captureFrame, frameInterval);
            } else {
                // console.log(`Stopped after ${currentFrame} frames`)

                // Stop recording and generate video
                const videoBlob = encoder.compile(false, (output) => {
                    const url = URL.createObjectURL(output);

                    // Trigger download
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'animation.webm';
                    a.click();

                    URL.revokeObjectURL(url);
                    setRecording(false);
                });
            }
        }; 

        captureFrame();
    }

    useEffect(() => {
        if (canvasRef.current) {
            setPlayCanvas(canvasRef.current);
            setPlaying(true);
        }
    }, []);

    useEffect(() => {
        let frameCount = 0;
        let animationFrameId;

        if (playCanvas && playing) {
            const render = () => {
                frameCount++;
                playAnimation(frameCount)
                animationFrameId = window.requestAnimationFrame(render);
            };
            render();
        }
        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [playAnimation, playCanvas]);

    return (
        <div className="PlayPage">
            <div className="PlayDiv">
                <canvas 
                    className="PlayCanvas"
                    ref={canvasRef}
                    width={1080}
                    height={720}
                />
            </div>
            <Bottombar onDownload={downloadAnimationNative} downloadValid={!recording} isPlaying={playing} onBack={() => {setState("home")}} onStop={() => {setPlaying(!playing)}} setState={setChecked}/>
        </div>
    )
}

function Bottombar({onDownload, downloadValid, isPlaying, onBack, onStop, setState}) {
    console.log(window.innerWidth);
    return (
        <div className="Bottombar">
            <img 
                className="BackBtn"
                src={BackBtn}
                alt="Back Button"
                onClick={onBack}
            />
            { downloadValid ? 
                // <img 
                //     className="DownloadBtn"
                //     src={DownloadBtn}
                //     alt="Download Button"
                //     onClick={onDownload}
                //     style={{opacity: "1.0"}}
                // /> :
                // <img 
                //     className="DownloadBtn"
                //     src={DownloadBtn}
                //     alt="Download Button"
                //     onClick={() => {}}
                //     style={{opacity: "0.2"}}
                // />
                <picture>
                    <source srcSet={DownloadBtn} media='(min-width: 960px)' />
                    <source srcSet={DownloadBtnMobile} media='(max-width: 960px)' />
                    <img 
                        className="DownloadBtn"
                        src={DownloadBtn}
                        alt="Download Button"
                        onClick={onDownload}
                        style={{opacity: "1.0"}} 
                    />
                </picture>
                :
                <picture>
                    <source srcSet={DownloadBtn} media='(min-width: 960px)' />
                    <source srcSet={DownloadBtnMobile} media='(max-width: 960px)' />
                    <img 
                        className="DownloadBtn"
                        src={DownloadBtn}
                        alt="Download Button"
                        onClick={onDownload}
                        style={{opacity: "0.2"}} 
                    />
                </picture>
            }
            { downloadValid ?
                <></>
                : <CircularProgress className="DownloadLoad" size="30px" style={{color: "#fafafa"}} />
            }
            <div className="BottomOptions">
                <FormControlLabel 
                    control={<Checkbox defaultChecked sx={{color: '#fafafa', '&.Mui-checked': {color: '#fafafa'}}} />} 
                    label="Orbit Path"
                    onChange={(event) => {
                        setState(event.target.checked);
                    }}
                    sx={{
                        '& .MuiFormControlLabel-label': { fontFamily: 'Outfit', fontSize: '16px', fontWeight: 400, color: '#fafafa' },
                    }}
                />
            </div>
            { isPlaying ?
                <picture>
                    <source srcSet={StopBtn} media='(min-width: 960px)' />
                    <source srcSet={StopBtnMobile} media='(max-width: 960px)' />
                    <img 
                        className="StopBtn"
                        src={StopBtn}
                        alt="Stop Button"
                        onClick={onStop}
                    />
                </picture>
                : 
                <picture>
                    <source srcSet={PlayBtn} media='(min-width: 960px)' />
                    <source srcSet={PlayBtnMobile} media='(max-width: 960px)' />
                    <img 
                        className="StopBtn"
                        src={PlayBtn}
                        alt="Play Button"
                        onClick={onStop}
                    />
                </picture>
            }
            
        </div>
    )
}
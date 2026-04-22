// =========================
// Session Data
// =========================
var subject = sessionStorage.getItem("subject");
var brandCode = sessionStorage.getItem("brandCode");
var studentName = sessionStorage.getItem("name");
var address = sessionStorage.getItem("address");
var fatherName = sessionStorage.getItem("fatherName");
var enrollment = sessionStorage.getItem("enrollment");
var imgUrl = sessionStorage.getItem("imgUrl");
var tabSwitchCount = 0;
var warningCount = 0;

// =========================
// Quiz Data
// =========================
var allQuestion = [];
var index = 0;
var total = 0;
var right = 0;
var wrong = 0;

// =========================
// On-Screen Message
// =========================
function showOnScreenMessage(message, duration = 3000) {
    let existingMessage = document.getElementById("onscreen-message");
    if (existingMessage) {
        existingMessage.innerText = message;
        return;
    }
    let msgBox = document.createElement("div");
    msgBox.id = "onscreen-message";
    msgBox.style.position = "fixed";
    msgBox.style.top = "15%";
    msgBox.style.left = "50%";
    msgBox.style.transform = "translateX(-50%)";
    msgBox.style.background = "rgba(0,0,0,0.8)";
    msgBox.style.color = "white";
    msgBox.style.padding = "15px 25px";
    msgBox.style.borderRadius = "10px";
    msgBox.style.fontSize = "16px";
    msgBox.style.zIndex = "9999";
    msgBox.style.textAlign = "center";
    msgBox.innerText = message;
    document.body.appendChild(msgBox);
    setTimeout(() => { if (msgBox) document.body.removeChild(msgBox); }, duration);
}

// =========================
// Check Test Attempt
// =========================
async function checkAttempt() {
    try {
        const res = await fetch(`http://localhost:3000/api/checkAttempt/${brandCode}/${encodeURIComponent(subject)}/${encodeURIComponent(enrollment)}`);
        const data = await res.json();
        if (data.attempted) {
            showOnScreenMessage("❌ You have already attempted this test!");
            setTimeout(() => {
                window.location = "../homepage/homepage.html";
            }, 3000);
            return false;
        }
        return true;
    } catch (err) {
        console.error("Error checking test attempt:", err);
        showOnScreenMessage("Error checking test attempt!");
        return false;
    }
}

// =========================
// Fetch Questions
// =========================
async function fetchQuestions() {
    try {
        const res = await fetch(`http://localhost:3000/api/questions/${brandCode}/${encodeURIComponent(subject)}`);
        const response = await res.json();
        if (response.ok && response.data) {
            allQuestion = response.data;
            total = allQuestion.length;
            createNavigation();
            getQuestionFunc();
            startExamTimer();
        } else {
            throw new Error(response.error || "Failed to load questions");
        }
    } catch (err) {
        console.error("Error fetching questions:", err);
        showOnScreenMessage("Failed to load questions!");
    }
}

// =========================
// Submit Quiz
// =========================
function submitFunc() {
    fetch('http://localhost:3000/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            brandCode: brandCode,
            enrollment: enrollment,
            name: studentName,
            subject: subject,
            rightAns: right,
            wrongAns: wrong,
            maxMark: total,
        })
    }).then(res => res.json())
      .then(data => {
        if (data.ok) {
            showOnScreenMessage("✅ Quiz submitted successfully!");
            setTimeout(() => { 
                sessionStorage.clear(); 
                window.location = "../homepage/homepage.html"; 
            }, 2000);
        } else {
            throw new Error(data.error || "Failed to submit results");
        }
    }).catch(err => {
        console.error(err);
        showOnScreenMessage("Error submitting quiz results.");
    });
}

// =========================
// Quiz Logic
// =========================
function getQuestionFunc() {
    updateNavigation();
    if (index >= total) return endQuiz();
    resetFunc();
    let data = allQuestion[index];
    document.querySelector(".question-el").innerHTML = `Q-${index + 1}: ${data.question}`;
    var allOptionsEl = document.querySelectorAll(".option");
    allOptionsEl[0].nextElementSibling.innerText = data.optionOne;
    allOptionsEl[1].nextElementSibling.innerText = data.optionTwo;
    allOptionsEl[2].nextElementSibling.innerText = data.optionThree;
    allOptionsEl[3].nextElementSibling.innerText = data.optionFour;
    if (allQuestion[index].answered) lockAnswers();
}

document.querySelector(".next-btn").onclick = function () {
    let ans = getAnswer();
    if (ans === undefined) { showOnScreenMessage("Select an answer!"); return; }
    allQuestion[index].selectedAnswer = ans;

    if (!allQuestion[index].answered) {
        if (ans.trim().toLowerCase() === allQuestion[index].correctAnswer.trim().toLowerCase()) right++;
        else wrong++;
    }

    allQuestion[index].answered = true;
    lockAnswers();
    updateNavigation();

    if (index < total - 1) { index++; setTimeout(getQuestionFunc, 300); }
    else { setTimeout(endQuiz, 300); }
};

function endQuiz() {
    clearInterval(examTimer);
    document.querySelector(".main").innerHTML = `
        <h2>Click Submit to finish your exam.</h2>
        <div align="center"><button class="quiz-submit-btn">Submit</button></div>
    `;
    document.querySelector(".quiz-submit-btn").onclick = submitFunc;
}

const getAnswer = () => {
    let answer;
    document.querySelectorAll(".option").forEach(input => {
        if (input.checked) answer = input.value;
    });
    return answer;
};

function resetFunc() {
    document.querySelectorAll(".option").forEach(input => {
        input.checked = false;
        input.disabled = allQuestion[index]?.answered || false;
        if (allQuestion[index]?.selectedAnswer && input.value === allQuestion[index].selectedAnswer) {
            input.checked = true;
        }
    });
}

function lockAnswers() {
    document.querySelectorAll(".option").forEach(input => input.disabled = true);
}

// =========================
// Navigation UI
// =========================
let navContainer = document.createElement("div");
navContainer.id = "question-nav";
navContainer.style.cssText = "position:fixed; bottom:10px; left:50%; transform:translateX(-50%); display:flex; gap:10px;";
document.body.appendChild(navContainer);

function createNavigation() {
    navContainer.innerHTML = "";
    for (let i = 0; i < total; i++) {
        let btn = document.createElement("button");
        btn.innerText = i + 1;
        btn.onclick = () => { index = i; getQuestionFunc(); };
        navContainer.appendChild(btn);
    }
}

function updateNavigation() {
    navContainer.querySelectorAll("button").forEach((btn, i) => {
        btn.style.background = allQuestion[i]?.answered ? "lightblue" : "white";
    });
}

// =========================
// Proctoring Logic
// =========================
let examTimer;

function startExamTimer() {
    let examTimeLeft = total * 30;
    let timerEl = document.getElementById("exam-timer") || document.createElement("div");
    timerEl.id = "exam-timer";
    timerEl.style.cssText = "position:fixed; top:10px; left:50%; transform:translateX(-50%); padding:10px; background:red; color:white; font-size:18px; font-weight:bold;";
    if (!document.getElementById("exam-timer")) document.body.appendChild(timerEl);

    clearInterval(examTimer);
    timerEl.innerText = `Time Left: ${examTimeLeft}s`;
    examTimer = setInterval(() => {
        examTimeLeft--;
        timerEl.innerText = `Time Left: ${examTimeLeft}s`;
        if (examTimeLeft <= 0) {
            clearInterval(examTimer);
            showOnScreenMessage("Time's up!");
            setTimeout(endQuiz, 3000);
        }
    }, 1000);
}

async function startCamera() {
    // ===== Create container for camera feed =====
    let cameraContainer = document.createElement('div');
    cameraContainer.style.cssText =
        'position:fixed; top:10px; right:10px; width:220px; height:180px; border:2px solid black; background:black; z-index:9999;';
    document.body.appendChild(cameraContainer);

    let videoEl = document.createElement('video');
    videoEl.style.cssText = 'width:100%; height:100%;';
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    cameraContainer.appendChild(videoEl);

    // Canvas overlay for gaze indicator
    let canvasEl = document.createElement('canvas');
    canvasEl.width = 220;
    canvasEl.height = 180;
    canvasEl.style.cssText = 'position:absolute; top:0; left:0;';
    cameraContainer.appendChild(canvasEl);
    let ctx = canvasEl.getContext('2d');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoEl.srcObject = stream;

        let faceWarningCount = 0;
        let gazeWarningCount = 0;
        let lastFaceWarningTime = 0;
        let lastGazeWarningTime = 0;

        // ===== Initialize Face Mesh =====
        const faceMesh = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });
        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        faceMesh.onResults((results) => {
            const now = Date.now();
            ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

            const noFace = !results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0;
            const multipleFaces = results.multiFaceLandmarks && results.multiFaceLandmarks.length > 1;

            // ===== Face warnings =====
            if ((noFace || multipleFaces) && now - lastFaceWarningTime > 3000) {
                faceWarningCount++;
                lastFaceWarningTime = now;

                let msg = noFace ? "No face detected!" : "Multiple faces detected!";
                showOnScreenMessage(`⚠️ Warning ${faceWarningCount}/3: ${msg}`);

                if (faceWarningCount >= 3) {
                    showOnScreenMessage("❌ Test submitted due to face violations!");
                    endQuiz(true);
                    return;
                }
            }

            // ===== Eye-gaze detection =====
            if (!noFace && results.multiFaceLandmarks.length === 1) {
                const landmarks = results.multiFaceLandmarks[0];

                // Iris landmarks
                const leftIris = landmarks[468];
                const rightIris = landmarks[473];

                // Eye corners
                const leftEye = landmarks[33];
                const rightEye = landmarks[263];

                const gazeX = (leftIris.x + rightIris.x) / 2;

                const leftThreshold = leftEye.x + 0.44 * (rightEye.x - leftEye.x);
                const rightThreshold = leftEye.x + 0.55 * (rightEye.x - leftEye.x);

                const lookingAway = gazeX < leftThreshold || gazeX > rightThreshold;

                if (lookingAway && now - lastGazeWarningTime > 3000) {
                    gazeWarningCount++;
                    lastGazeWarningTime = now;
                    showOnScreenMessage(`⚠️ Warning ${gazeWarningCount}/3: Eyes looking away!`);

                    if (gazeWarningCount >= 3) {
                        showOnScreenMessage("❌ Test submitted due to gaze violations!");
                        endQuiz(true);
                        return;
                    }
                }
            }
        });

        // ===== MediaPipe Camera Utils =====
        const mpCamera = new Camera(videoEl, {
            onFrame: async () => await faceMesh.send({ image: videoEl }),
            width: 320,
            height: 240
        });
        mpCamera.start();

        stream.getVideoTracks()[0].onended = () => {
            showOnScreenMessage("Camera lost! Submitting test.", 4000);
            setTimeout(() => endQuiz(true), 3000);
        };

    } catch (error) {
        alert("Camera access is required for the test.");
        window.location = "../homepage/homepage.html";
    }
}




async function startAudioDetection() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const microphone = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 512;
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let audioWarningCount = 0;
        let lastWarningTime = 0; // to track cooldown

        function detectNoise() {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

            const now = Date.now();

            if (average > 100 && now - lastWarningTime > 3000) { // 3s cooldown
                audioWarningCount++;
                lastWarningTime = now;

                showOnScreenMessage(`⚠️ Warning ${audioWarningCount}/3: Noise detected!`);

                if (audioWarningCount >= 3) {
                    showOnScreenMessage("❌ Test submitted due to excessive noise!");
                    endQuiz();
                    return; // stop after submission
                }
            }

            requestAnimationFrame(detectNoise);
        }

        detectNoise();
    } catch (error) {
        console.error("Microphone access error:", error);
    }
}


function enableFullScreen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    }
}

// Tab switch check
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        tabSwitchCount++;
        showOnScreenMessage(`Warning ${tabSwitchCount}/2: Do not switch tabs!`);
        if (tabSwitchCount >= 2) {
            showOnScreenMessage("Test submitted due to tab switching!");
            endQuiz();
        }
    }
});

// Fullscreen exit check
document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
        showOnScreenMessage("You must stay in fullscreen mode!", 4000);
        setTimeout(endQuiz, 3000);
    }
});

// =========================
// Start Test Overlay
// =========================
document.addEventListener("DOMContentLoaded", function () {
    let overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); color:white; display:flex; align-items:center; justify-content:center; z-index:9999;";
    overlay.innerHTML = `
        <div style="text-align:center;">
            <h2>Enter fullscreen & allow camera to begin.</h2>
            <button id="start-test-btn" style="padding:10px 20px;">Start Test</button>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById("start-test-btn").onclick = async function () {
        const canStart = await checkAttempt();
        if (!canStart) return;

        document.body.removeChild(overlay);
        enableFullScreen();
        await startCamera();
        startAudioDetection();
        fetchQuestions();
    };
});

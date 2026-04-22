// Global variables
var selectSubjectEl = document.querySelector("#select-subject-el");
var startQuizBtn = document.querySelector(".start-quiz-btn");
var brandCode = sessionStorage.getItem("brandCode");

// Fetch subjects from the server
// CHANGED: Corrected the fetch URL syntax
fetch(`http://localhost:3000/api/subjects/${brandCode}`)
    .then(res => res.json())
    .then(response => {
        // CHANGED: Check if the request was successful and access the .data property
        if (response.ok && response.data) {
            response.data.forEach(subject => {
                // CHANGED: Use the correct property names (id, subjectName) sent by the server
                selectSubjectEl.innerHTML += `<option value="${subject.id}">${subject.subjectName}</option>`;
            });
        } else {
            console.error("Failed to load subjects:", response.error);
        }
    })
    .catch(err => console.error("Error fetching subjects:", err));

// Start Quiz button (No changes needed here)
startQuizBtn.onclick = function () {
    if (selectSubjectEl.value !== "" && selectSubjectEl.value !== "choose subject") {
        var subjectCode = selectSubjectEl.value;
        var subjectName = selectSubjectEl.options[selectSubjectEl.selectedIndex].text;
        sessionStorage.setItem("subject", subjectName);
        sessionStorage.setItem("subjectCode", subjectCode);

        // Fullscreen overlay
        let overlay = document.createElement("div");
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); color: white; display: flex;
            align-items: center; justify-content: center; z-index: 9999;
        `;
        overlay.innerHTML = `
            <div style="text-align:center;">
                <h2>Click below to enter fullscreen mode and start your test.</h2>
                <button id="enter-fullscreen" style="padding:10px 20px; font-size:16px;">Start Test</button>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById("enter-fullscreen").onclick = function () {
            document.body.removeChild(overlay);
            let elem = document.documentElement;
            if (elem.requestFullscreen) elem.requestFullscreen();
            else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
            else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
            else if (elem.msRequestFullscreen) elem.msRequestFullscreen();

            // Redirect to quiz page
            setTimeout(() => window.location = "../quiz/quiz.html", 500);
        };
    } else {
        swal("Select Subject!", "Please select a subject first!", "warning");
    }
};
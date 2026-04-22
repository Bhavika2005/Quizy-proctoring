/* ====== Dashboard (DB-backed) JS ======
   Replaces localStorage usage with fetch() to backend API.
   Assumes API routes described in the assistant message exist.
   Keep sessionStorage brandCode (set on login).
========================================*/

// ---------------------- helpers ----------------------
const API_BASE = "http://localhost:3000/api";

async function apiGet(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    return await res.json();
  } catch (err) {
    console.error("API GET error:", err, path);
    return { ok: false, error: "NETWORK_ERROR" };
  }
}

async function apiPost(path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (err) {
    console.error("API POST error:", err, path, body);
    return { ok: false, error: "NETWORK_ERROR" };
  }
}

async function apiPut(path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (err) {
    console.error("API PUT error:", err, path, body);
    return { ok: false, error: "NETWORK_ERROR" };
  }
}

async function apiDelete(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "DELETE"
    });
    return await res.json();
  } catch (err) {
    console.error("API DELETE error:", err, path);
    return { ok: false, error: "NETWORK_ERROR" };
  }
}

// ---------------------- authentication & initial brand check ----------------------
let brandCode = sessionStorage.getItem("brandCode");

if (!brandCode) {
  document.body.innerHTML = "";
  document.body.style.background = "black";
  swal("Un Authorised User !", "Do Not Waste Your Time !", "warning");
  throw new Error("No brandCode in sessionStorage");
}

let allUserData = null;
(async function loadBrand() {
  const r = await apiGet(`/brand/${encodeURIComponent(brandCode)}`);
  if (r.ok) {
    allUserData = r.data;
    const brandNameEl = document.getElementById("brand-name");
    if (brandNameEl) brandNameEl.innerHTML = "Welcome Mr : " + (allUserData.brandName || brandCode);
  } else {
    console.error("Failed to load brand:", r.error);
    swal("Error", "Cannot load brand data", "error");
  }
})();

// ---------------------- logout ----------------------
var logoutBtn = document.querySelector("#logout-btn");
if (logoutBtn) {
  logoutBtn.onclick = function () {
    this.innerHTML = "Please wait...";
    this.disabled = true;
    this.style.background = "#ccc";
    setTimeout(function () {
      sessionStorage.removeItem("brandCode");
      window.location = "../company/company.html";
    }, 1000);
  };
}

// ---------------------- SUBJECTS management ----------------------
var visibleSubject = document.querySelector(".visible-subject");
var subjectBtn = document.querySelector(".subject-btn");
var subjectEl = document.querySelector(".subject");
var allSubject = []; // will store objects { id, subjectName }

async function refreshSubjects() {
  // fetch from API
  const r = await apiGet(`/subjects/${encodeURIComponent(brandCode)}`);
  if (r.ok) {
    allSubject = r.data || [];
    renderSubjects();
    populateChooseSubject(); // update selects
  } else {
    console.error("Failed to fetch subjects:", r.error);
  }
}

function renderSubjects() {
  visibleSubject.innerHTML = "";
  allSubject.forEach((s, index) => {
    const indexAttr = s.id ?? index;
    const html = `
      <div class="d-flex subject-box justify-content-between align-items-center" data-id="${s.id}">
          <h3 index='${indexAttr}'>${escapeHtml(s.subjectName)}</h3>
          <div>
              <i class="fa fa-edit edit-btn mx-2" style="font-size: 22px;cursor:pointer"></i>
              <i class="fa fa-save save-btn mx-2 d-none" style="font-size: 22px;cursor:pointer"></i>
              <i class="fa fa-trash del-btn mx-2" style="font-size: 22px;cursor:pointer"></i>
          </div>
      </div>
    `;
    visibleSubject.insertAdjacentHTML("beforeend", html);
  });
  attachSubjectHandlers();
}

function attachSubjectHandlers() {
  const delAllBtn = visibleSubject.querySelectorAll(".del-btn");
  delAllBtn.forEach(btn => {
    btn.onclick = async function () {
      const parent = this.closest(".subject-box");
      const id = parent.getAttribute("data-id");
      const subjectName = parent.querySelector("h3").innerText;
      swal({
        title: "Are you sure?",
        text: `Delete subject "${subjectName}"?`,
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then(async (willDelete) => {
        if (willDelete) {
          if (id) {
            const res = await apiDelete(`/subjects/${id}`);
            if (!res.ok) return swal("Error", res.error || "Failed to delete", "error");
          } else {
            // fallback: remove locally if no id (shouldn't happen)
            allSubject = allSubject.filter(s => s.subjectName !== subjectName);
          }
          parent.remove();
          await refreshSubjects();
          swal("Deleted!", "Subject removed", "success");
        } else {
          swal("Cancelled", "Your subject is safe!");
        }
      });
    };
  });

  const allEditBtn = visibleSubject.querySelectorAll(".edit-btn");
  allEditBtn.forEach((btn, i) => {
    btn.onclick = function () {
      const parent = this.closest(".subject-box");
      const h3 = parent.getElementsByTagName("H3")[0];
      const saveBtn = parent.querySelector(".save-btn");
      h3.contentEditable = true;
      h3.focus();
      this.classList.add("d-none");
      saveBtn.classList.remove("d-none");

      saveBtn.onclick = async function () {
        const editedSub = h3.innerText.trim();
        const id = parent.getAttribute("data-id");
        if (!editedSub) {
          swal("Empty", "Subject cannot be empty", "warning");
          return;
        }
        if (id) {
          const res = await apiPut(`/subjects/${id}`, { subjectName: editedSub });
          if (!res.ok) return swal("Error", res.error || "Failed to update", "error");
        }
        h3.contentEditable = false;
        saveBtn.classList.add("d-none");
        btn.classList.remove("d-none");
        await refreshSubjects();
        swal("Updated", "Subject updated successfully", "success");
      };
    };
  });
}

subjectBtn.onclick = async function (e) {
  e.preventDefault();
  const value = subjectEl.value && subjectEl.value.trim();
  if (!value) {
    swal("Subject is Empty !", "Please Enter Subject !", "warning");
    return;
  }
  // create via API
  const res = await apiPost("/subjects", { brandCode, subjectName: value });
  if (res.ok) {
    subjectEl.value = "";
    await refreshSubjects();
    swal("Success!", "Subject added", "success");
  } else {
    swal("Error", res.error || "Failed to add subject", "warning");
  }
};

// ---------------------- QUESTIONS management ----------------------
var chooseSubject = document.querySelector("#choose-subject");
var questionForm = document.querySelector(".question-form");
var allQuesInput = questionForm ? questionForm.querySelectorAll("INPUT") : [];
var selectSubject = document.querySelector("#select-subject");
var subjectResultEl = document.querySelector("#subject-result-el");
var newQuestions = []; // current selected subject's questions
var visibleQuestion = document.querySelector(".visible-question");

async function populateChooseSubject() {
  // fill three selects: chooseSubject, selectSubject, subjectResultEl
  if (!chooseSubject) return;
  chooseSubject.innerHTML = `<option>choose subject</option>`;
  selectSubject.innerHTML = `<option>choose subject</option>`;
  if (subjectResultEl) subjectResultEl.innerHTML = `<option>choose subject</option>`;

  allSubject.forEach(s => {
    const opt = `<option value="${escapeHtml(s.subjectName)}">${escapeHtml(s.subjectName)}</option>`;
    chooseSubject.insertAdjacentHTML("beforeend", opt);
    selectSubject.insertAdjacentHTML("beforeend", opt);
    if (subjectResultEl) subjectResultEl.insertAdjacentHTML("beforeend", opt);
  });
}

async function fetchQuestionsFor(subjectName) {
  const r = await apiGet(`/questions/${encodeURIComponent(brandCode)}/${encodeURIComponent(subjectName)}`);
  if (r.ok) {
    newQuestions = r.data || [];
    renderQuestions();
  } else {
    console.error("Failed to fetch questions:", r.error);
    visibleQuestion.innerHTML = "<b style='color:red'>No Data Available !</b>";
  }
}

function renderQuestions() {
  visibleQuestion.innerHTML = "";
  if (!newQuestions || newQuestions.length === 0) {
    visibleQuestion.innerHTML = "<b style='color:red'>No Data Available !</b>";
    return;
  }
  newQuestions.forEach((q, index) => {
    visibleQuestion.insertAdjacentHTML("beforeend", `
      <div class="mb-5" data-index="${q.id ?? index}">
          <br>
          <div class="d-flex justify-content-between">
              <h3>${index + 1}) ${escapeHtml(q.question)}</h3>
              <div>
                  <i class="fa fa-edit edit-btn mx-3" style="cursor:pointer"></i>
                  <i class="fa fa-save save-btn d-none mx-3" style="cursor:pointer"></i>
                  <i class="fa fa-trash del-btn mx-3" style="cursor:pointer"></i>
              </div>
          </div>
          <br>
          <div>
              <span>1) ${escapeHtml(q.optionOne)}</span>
              <br><br>
              <span>2) ${escapeHtml(q.optionTwo)}</span>
              <br><br>
              <span>3) ${escapeHtml(q.optionThree)}</span>
              <br><br>
              <span>4) ${escapeHtml(q.optionFour)}</span>
              <br><br>
              <span class="bg-info text-white p-3">${escapeHtml(q.correctAnswer)}</span>
              <br><br>
          </div>
      </div>
    `);
  });
  attachQuestionHandlers();
}

function attachQuestionHandlers() {
  const allDelBtn = visibleQuestion.querySelectorAll(".del-btn");
  allDelBtn.forEach(btn => {
    btn.onclick = function (e) {
      const parent = this.closest("[data-index]");
      const qId = parent.getAttribute("data-index");
      const index = Array.from(visibleQuestion.children).indexOf(parent);
      swal({
        title: "Are you sure?",
        text: "Once deleted, you will not be able to recover this question!",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then(async (willDelete) => {
        if (willDelete) {
          if (qId) {
            const res = await apiDelete(`/questions/${qId}`);
            if (!res.ok) return swal("Error", res.error || "Failed to delete", "error");
            await fetchQuestionsFor(selectSubject.value);
          } else {
            newQuestions.splice(index, 1);
            await saveQuestionsFallback(selectSubject.value); // fallback
            renderQuestions();
          }
          swal("Deleted!", "Question removed", "success");
        }
      });
    };
  });

  const allEditBtn = visibleQuestion.querySelectorAll(".edit-btn");
  allEditBtn.forEach((btn, idx) => {
    btn.onclick = function () {
      const parent = this.closest("[data-index]");
      const saveBtn = parent.querySelector(".save-btn");
      const h3 = parent.querySelector("h3");
      const span = parent.querySelectorAll("span");
      this.classList.add("d-none");
      saveBtn.classList.remove("d-none");

      h3.contentEditable = true;
      h3.focus();
      span.forEach(s => { s.contentEditable = true; s.style.border = "2px solid red"; });

      saveBtn.onclick = async function () {
        const subject = selectSubject.value;
        const qId = parent.getAttribute("data-index");
        const index = +Array.from(visibleQuestion.children).indexOf(parent);
        const questionText = h3.innerText.replace(`${index + 1}) `, "").trim();
        const opOne = span[0].innerText.replace("1) ", "").trim();
        const opTwo = span[1].innerText.replace("2) ", "").trim();
        const opThree = span[2].innerText.replace("3) ", "").trim();
        const opFour = span[3].innerText.replace("4) ", "").trim();
        const corAns = span[4].innerText.trim();

        swal({
          title: "Are you sure?",
          text: "Once Updated, you will not be able to recover the old version!",
          icon: "warning",
          buttons: true,
          dangerMode: true,
        }).then(async (willUpdated) => {
          if (willUpdated) {
            if (qId && !isNaN(qId)) {
              const res = await apiPut(`/questions/${qId}`, {
                question: questionText, optionOne: opOne, optionTwo: opTwo,
                optionThree: opThree, optionFour: opFour, correctAnswer: corAns
              });
              if (!res.ok) return swal("Error", res.error || "Failed to update", "error");
            } else {
              // fallback insert
              await apiPost("/questions", {
                brandCode, subjectName: subject, question: questionText,
                optionOne: opOne, optionTwo: opTwo, optionThree: opThree,
                optionFour: opFour, correctAnswer: corAns
              });
            }
            await fetchQuestionsFor(subject);
            saveBtn.classList.add("d-none");
            btn.classList.remove("d-none");
            h3.contentEditable = false;
            span.forEach(s => { s.contentEditable = false; s.style.border = "none"; });
            swal("Updated", "Question updated successfully", "success");
          }
        });
      };
    };
  });
}

// fallback function to save bulk questions if API for that doesn't exist
async function saveQuestionsFallback(subject) {
  if (!newQuestions) return;
  // try deleting existing questions for brand/subject and inserting all
  await apiPost("/questions/bulk", { brandCode, subjectName: subject, questions: newQuestions });
}

// handling question form submit (create)
if (questionForm) {
  questionForm.onsubmit = async (e) => {
    e.preventDefault();
    const subjectName = chooseSubject.value;
    if (!subjectName || subjectName === "choose subject") {
      swal("Choose Subject !", "Please Select a Subject !", "warning");
      return;
    }
    const q = {
      brandCode,
      subjectName,
      question: allQuesInput[0].value,
      optionOne: allQuesInput[1].value,
      optionTwo: allQuesInput[2].value,
      optionThree: allQuesInput[3].value,
      optionFour: allQuesInput[4].value,
      correctAnswer: allQuesInput[5].value
    };
    const res = await apiPost("/questions", q);
    if (res.ok) {
      swal("Success !", "Data Inserted successfully !", "success");
      questionForm.reset();
      await fetchQuestionsFor(subjectName);
    } else {
      swal("Error", res.error || "Failed to insert question", "error");
    }
  };
}

// when selectSubject changes, load questions
if (selectSubject) {
  selectSubject.onchange = async () => {
    const value = selectSubject.value;
    if (value && value !== "choose subject") {
      await fetchQuestionsFor(value);
    } else {
      visibleQuestion.innerHTML = "<b style='color:red'>No Data Available !</b>";
    }
  };
}

// ---------------------- REGISTRATIONS (students) ----------------------
var registrationForm = document.querySelector(".registration-form");
var allRegInput = registrationForm ? registrationForm.querySelectorAll("INPUT") : [];
var userType = registrationForm ? registrationForm.querySelector("select") : null;
var addressField = registrationForm ? registrationForm.querySelector("textarea") : null;
var registrationDataEl = document.querySelector(".registration-data");
var profileBox = document.querySelector(".upload-box");
var uploadInput = document.querySelector(".upload-input");
var modalImgUrl = null;
var registrationData = []; // will be fetched from server

async function refreshRegistrations() {
  const r = await apiGet(`/registrations/${encodeURIComponent(brandCode)}`);
  if (r.ok) {
    registrationData = r.data || [];
    renderRegistrations();
  } else {
    console.error("Failed to fetch registrations:", r.error);
  }
}

function renderRegistrations() {
  registrationDataEl.innerHTML = "";
  registrationData.forEach((allData, index) => {
    registrationDataEl.insertAdjacentHTML("beforeend", `
      <tr data-id="${allData.id}">
          <th scope="row">${index + 1}</th>
          <td>
              <div class="profile">
                  <img src="${escapeHtml(allData.profilePic || 'images/avtar.png')}" width="40" height="40" alt="">
              </div>
          </td>
          <td class="text-nowrap" style="width: 8rem;">${escapeHtml(allData.name)}</td>
          <td class="text-nowrap" style="width: 8rem;">${escapeHtml(allData.fatherName)}</td>
          <td class="text-nowrap" style="width: 8rem;">${escapeHtml(formatDate(allData.dob))}</td>
          <td class="text-nowrap" style="width: 8rem;">${escapeHtml(allData.userType)}</td>
          <td class="text-nowrap" style="width: 8rem;">${escapeHtml(allData.mobile)}</td>
          <td class="text-nowrap" style="width: 8rem;">${escapeHtml(allData.enrollment)}</td>
          <td class="text-nowrap" style="width: 8rem;">${escapeHtml(allData.password)}</td>
          <td style="width: 8rem;">${escapeHtml(allData.address)}</td>
          <td class="text-nowrap" style="width: 8rem;">
              <i class='fa fa-trash del-btn mx-3' style="cursor:pointer"></i>
              <i class='fa fa-eye edit-btn' data-bs-toggle="modal" data-bs-target="#myModal" style="cursor:pointer"></i>
          </td>
      </tr>
    `);
  });
  attachRegistrationHandlers();
}

function attachRegistrationHandlers() {
  const allDelBtn = registrationDataEl.querySelectorAll(".del-btn");
  allDelBtn.forEach((btn, i) => {
    btn.onclick = function () {
      const parent = this.closest("tr");
      const id = parent.getAttribute("data-id");
      swal({
        title: "Are you sure?",
        text: "Once deleted, you will not be able to recover this record!",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then(async (willDelete) => {
        if (willDelete) {
          const res = await apiDelete(`/registrations/${id}`);
          if (!res.ok) return swal("Error", res.error || "Failed to delete", "error");
          await refreshRegistrations();
          swal("Deleted!", "Registration removed", "success");
        }
      });
    };
  });

  const allEditBtn = registrationDataEl.querySelectorAll(".edit-btn");
  allEditBtn.forEach((btn, index) => {
    btn.onclick = function () {
      const parent = this.closest("tr");
      const id = parent.getAttribute("data-id");
      const td = parent.querySelectorAll("td");
      // fill modal inputs (assuming modal layout matches previous)
      const modalForm = document.querySelector(".modal-form");
      const allModalInput = modalForm.querySelectorAll("input");
      const modalTextarea = modalForm.querySelector("textarea");
      const imgUrl = td[0].querySelector("img").src;
      const name = td[1].innerText;
      const fatherName = td[2].innerText;
      const dob = td[3].innerText;
      const userTypeText = td[4].innerText;
      const mobile = td[5].innerText;
      const enrollment = td[6].innerText;
      const password = td[7].innerText;
      const address = td[8].innerText;

      profileBox.style.backgroundImage = `url(${imgUrl})`;
      allModalInput[0].value = name;
      allModalInput[1].value = fatherName;
      allModalInput[2].value = dob;
      allModalInput[3].value = userTypeText;
      allModalInput[4].value = mobile;
      allModalInput[5].value = enrollment;
      allModalInput[6].value = password;
      modalTextarea.value = address;

      // disable initially
      allModalInput.forEach(i => i.disabled = true);
      modalTextarea.disabled = true;
      uploadInput.disabled = true;

      const modalEditBtn = document.querySelector(".modal-edit");
      const modalUpdateBtn = document.querySelector(".modal-updatte-btn");

      modalEditBtn.onclick = () => {
        allModalInput.forEach(i => i.disabled = false);
        modalTextarea.disabled = false;
        uploadInput.disabled = false;
        modalEditBtn.classList.add("d-none");
        modalUpdateBtn.classList.remove("d-none");

        modalUpdateBtn.onclick = async function () {
          const updated = {
            name: allModalInput[0].value,
            fatherName: allModalInput[1].value,
            dob: allModalInput[2].value,
            userType: allModalInput[3].value,
            mobile: allModalInput[4].value,
            enrollment: allModalInput[5].value,
            password: allModalInput[6].value,
            address: modalTextarea.value,
            profilePic: modalImgUrl ? modalImgUrl : imgUrl
          };
          swal({
            title: "Are you sure?",
            text: "Update this registration?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
          }).then(async (willUpdated) => {
            if (willUpdated) {
              const res = await apiPut(`/registrations/${id}`, updated);
              if (!res.ok) return swal("Error", res.error || "Failed to update", "error");
              await refreshRegistrations();
              // close modal
              document.querySelector(".btn-close").click();
              swal("Updated", "Registration updated", "success");
            }
          });
        };
      };
    };
  });
}

// registration submit (create)
if (registrationForm) {
  registrationForm.onsubmit = async function (e) {
    e.preventDefault();
    if (!userType || userType.value === "choose type") {
      swal("Choose type !", "Please Select a user !", "warning");
      return;
    }
    const data = {
      brandCode,
      name: allRegInput[0].value,
      fatherName: allRegInput[1].value,
      dob: allRegInput[2].value,
      userType: userType.value,
      mobile: allRegInput[3].value,
      enrollment: allRegInput[4].value,
      password: allRegInput[5].value,
      address: addressField.value,
      profilePic: modalImgUrl || "images/avtar.png"
    };
    // check unique enrollment server-side or via API
    const res = await apiPost("/registrations", data);
    if (res.ok) {
      swal("Data Inserted !", "Registration done successfully !", "success");
      registrationForm.reset();
      modalImgUrl = null;
      await refreshRegistrations();
    } else {
      swal("Error", res.error || "Failed to register", "warning");
    }
  };
}

// read photo coding
if (uploadInput) {
  uploadInput.onchange = function () {
    var fReader = new FileReader();
    fReader.onload = function (e) {
      modalImgUrl = e.target.result;
      profileBox.style.backgroundImage = `url(${modalImgUrl})`;
    };
    fReader.readAsDataURL(uploadInput.files[0]);
  };
}

// ---------------------- TOGGLER (UI) ----------------------
var togglersBtn = document.querySelectorAll(".toggler-icon");
var sideNav = document.querySelector(".side-nav");
if (togglersBtn && togglersBtn.length >= 2) {
  togglersBtn[0].onclick = function () {
    sideNav.classList.add("active");
    this.classList.add("d-none");
    togglersBtn[1].classList.remove("d-none");
  };
  togglersBtn[1].onclick = function () {
    sideNav.classList.remove("active");
    this.classList.add("d-none");
    togglersBtn[0].classList.remove("d-none");
  };
}

// ---------------------- RESULTS & CERTIFICATE ----------------------
let allResult = [];
var allUserResultBox = document.querySelector(".subject-result-data");

if (subjectResultEl) {
  subjectResultEl.addEventListener('change', async () => {
    allUserResultBox.innerHTML = "";
    const subject = subjectResultEl.value;
    if (subject && subject !== "choose subject") {
      const r = await apiGet(`/results/${encodeURIComponent(brandCode)}/${encodeURIComponent(subject)}`);
      if (r.ok) {
        allResult = r.data || [];
        allResult.forEach((data, index) => {
          allUserResultBox.insertAdjacentHTML("beforeend", `
            <tr>
              <td class="text-nowrap" style="width: 8rem;">${index + 1}</td>
              <td class="text-nowrap" style="width: 8rem;">${escapeHtml(data.name)}</td>
              <td class="text-nowrap" style="width: 8rem;">${escapeHtml(data.enrollment)}</td>
              <td class="text-nowrap" style="width: 8rem;">${escapeHtml(data.subject)}</td>
              <td class="text-nowrap" style="width: 8rem;">${escapeHtml(data.rightAns)}</td>
              <td class="text-nowrap" style="width: 8rem;">${escapeHtml(data.wrongAns)}</td>
              <td class="text-nowrap" style="width: 8rem;">${escapeHtml(data.maxMark)}</td>
            </tr>
          `);
        });
      } else {
        swal("Error", r.error || "Failed to fetch results", "error");
      }
    } else {
      swal("Select Subject", "Please select subject first", "warning");
    }
  });
}

// Elements
let closeBtn = document.querySelector(".certificate-close-btn");
let certificateMainBox = document.querySelector(".certificate-main");
let certificateForm = document.querySelector(".certificate-form");
var cirInput = certificateForm ? certificateForm.querySelector("input") : null;
let cirBrandName = certificateMainBox ? certificateMainBox.querySelector(".brand-name") : null;
let cirAddress = certificateMainBox ? certificateMainBox.querySelector(".brand-address") : null;
let cirName = certificateMainBox ? certificateMainBox.querySelector(".cir-name") : null;
let cirEnrollment = certificateMainBox ? certificateMainBox.querySelector(".cir-enrollment") : null;
let cirFather = certificateMainBox ? certificateMainBox.querySelector(".cir-father") : null;
let cirData = certificateMainBox ? certificateMainBox.querySelector(".cir-data") : null;
let cirTotal = certificateMainBox ? certificateMainBox.querySelectorAll(".cir-total") : [];
let cirProfile = certificateMainBox ? certificateMainBox.querySelector(".cir-profile") : null;
let finalResultBox = certificateMainBox ? certificateMainBox.querySelector(".final-result-box") : null;

// On form submit
if (certificateForm) {
  certificateForm.onsubmit = async function (e) {
    e.preventDefault();
    await getUserResult();
  };
}

// Fetch and display certificate data
async function getUserResult() {
  if (!cirInput || !cirInput.value) {
    swal("Input field is empty!", "Please enter enrollment first", "warning");
    return;
  }

  const enrollment = cirInput.value.trim();
  const r = await apiGet(`/certificate/${encodeURIComponent(brandCode)}/${encodeURIComponent(enrollment)}`);

  if (!r.ok) {
    return swal("No Result Found!", "There is no result related to this enrollment", "warning");
  }

  const resultData = r.data || [];
  if (!certificateMainBox) return;
  certificateMainBox.classList.add("active");

  // Fill student details
  cirBrandName.innerHTML = allUserData.brandName || brandCode;
  cirAddress.innerHTML = allUserData.address || "";
  cirName.innerHTML = resultData[0]?.name || "";
  cirEnrollment.innerHTML = resultData[0]?.enrollment || "";
  cirFather.innerHTML = resultData[0]?.fatherName || "";
  if (cirProfile) cirProfile.src = resultData[0]?.profilePic || "images/avtar.png";

  // Prepare marks
  let totalMaxMarks = 0, obtainedMarks = 0;
  cirData.innerHTML = "";

  resultData.forEach((data, index) => {
    let subjectMax = Number(data.maxMark || 0);
    let subjectScore = Number(data.rightAns || 0);

    cirData.insertAdjacentHTML("beforeend", `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(data.subject)}</td>
        <td>${subjectMax}</td>
        <td>${subjectScore}</td>
        <td>${escapeHtml(data.wrongAns)}</td>
      </tr>
    `);

    totalMaxMarks += subjectMax;
    obtainedMarks += subjectScore;
  });

  // Show totals
  if (cirTotal[0]) cirTotal[0].innerHTML = totalMaxMarks;
  if (cirTotal[1]) cirTotal[1].innerHTML = obtainedMarks;
  if (cirTotal[2]) cirTotal[2].innerHTML = `${obtainedMarks}/${totalMaxMarks}`;

  // Final % and Pass/Fail
  let percentage = totalMaxMarks ? (obtainedMarks / totalMaxMarks * 100).toFixed(2) : "0.00";
  if (Number(percentage) < 33) {
    if (finalResultBox) finalResultBox.innerHTML = "FAIL (" + percentage + "%)";
  } else {
    if (finalResultBox) finalResultBox.innerHTML = "PASS (" + percentage + "%)";
  }
}

// Close certificate
if (closeBtn) closeBtn.onclick = function () {
  if (certificateMainBox) certificateMainBox.classList.remove("active");
};


// ---------------------- INITIAL LOAD ----------------------
(async function init() {
  await refreshSubjects();
  await refreshRegistrations();
  // initial populate selects
  populateChooseSubject();
})();

// ---------------------- small helpers ----------------------
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(d) {
  if (!d) return "";
  // try to parse common date formats; return original if parse fails
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toISOString().split("T")[0];
}

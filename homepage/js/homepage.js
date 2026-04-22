// ✅ Get all brand codes from database instead of localStorage
var brandCodeEl = document.querySelector("#brand-code-el");

fetch("http://localhost:3000/api/brands")
    .then(res => res.json())
    .then(data => {
        data.forEach(brand => {
            brandCodeEl.innerHTML += `
                <option value="${brand.brandCode}">${brand.brandCode}</option>
            `;
        });
    })
    .catch(err => {
        console.error(err);
        swal("Error", "Failed to load brand codes!", "error");
    });

// ✅ Global variables
var loginForm = document.querySelector(".login-form");
var allLoginInput = loginForm.querySelectorAll("input");
var loginBtn = loginForm.querySelector("button");
var brandCode;
var allUserData = [];

// ✅ When user selects a brand
brandCodeEl.addEventListener("change", () => {
    if (brandCodeEl.value !== "choose space code") {
        sessionStorage.setItem("brandCode", brandCodeEl.value);
        allLoginInput[0].disabled = false;
        allLoginInput[1].disabled = false;
        loginBtn.disabled = false;
        brandCode = brandCodeEl.value;
        loginUserFun();
    } else {
        allLoginInput[0].disabled = true;
        allLoginInput[1].disabled = true;
        loginBtn.disabled = true;
        swal("Please select brand !", "Please select brand code first !", "warning");
    }
});

// ✅ Fetch user data from MySQL API
const loginUserFun = () => {
    fetch(`http://localhost:3000/api/users?brandCode=${brandCode}`)
        .then(res => res.json())
        .then(data => {
            allUserData = data;
            console.log("Fetched Users:", allUserData);

            loginForm.onsubmit = function (e) {
                e.preventDefault();

                let checkEnroll = allUserData.find((user) => {
                    return user.enrollment === allLoginInput[0].value;
                });

                console.log("Matched User:", checkEnroll);

                if (checkEnroll) {
                    if (checkEnroll.password === allLoginInput[1].value) {
                        if (checkEnroll.userType === "guide") {
                            sessionStorage.setItem("brandCode", brandCode);
                            window.location = "../dashboard/dashboard.html";
                        } else {
                            sessionStorage.setItem("enrollment", checkEnroll.enrollment);
                            sessionStorage.setItem("name", checkEnroll.name);
                            sessionStorage.setItem("address", checkEnroll.address);
                            sessionStorage.setItem("fatherName", checkEnroll.fatherName);
                            sessionStorage.setItem("brandCode", brandCode);
                            sessionStorage.setItem("imgUrl", checkEnroll.profilePic);
                            window.location = "../welcome/welcome.html";
                        }
                    } else {
                        swal("Wrong Password !", "Please Contact Your Guide !", "warning");
                    }
                } else {
                    swal("Wrong Id Number !", "Please Contact Your Guide !", "warning");
                }
            };
        })
        .catch(err => {
            console.error(err);
            swal("Error", "Could not load users for this brand!", "error");
        });
};

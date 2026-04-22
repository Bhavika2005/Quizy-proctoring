Quizy-Proctor
A secure web-based quiz platform with integrated proctoring features to prevent cheating during online exams. It includes functionalities like camera monitoring, mic noise detection, and tab-switch tracking to ensure a fair testing environment. It also provide the whole student management system (students data, exam data, result data).


## Contributors

This project was completed as a team effort by:

- **Prathamesh Kolhe** 
- **Soham Jathar**
- **Bhavika Kadam**
- **Onkar Deshmukh**

Thank you all for your contributions!



💻 **How to Run the Project**
Prerequisites:
A web browser (Google Chrome or Firefox recommended)
Node.js (if using server-side features) or any basic web server for serving the HTML, CSS, and JS files

**Steps to Run:**
1) Download the zip file and extract the folder.
2) Open the folder in VSCode.
3) Open Company.html with live server.



📝 **Features**
**Proctoring Features:**

Camera Monitoring: Detects if the camera is on or off(If camera is not on then the test will be submitted).

Mic Noise Detection: Monitors ambient noise levels. If noise exceeds a threshold, a warning is given, and after three warnings, the quiz is automatically submitted.

Tab-Switch Tracking: Prevents users from switching tabs during the exam and monitors if the test window is tampered with.

Single attempt: Keeps track on the attempts Prevents multiple attempts.

Time limit: There is time limit of 30 sec for each question which will be calculated automatically and set.


**Quiz Functionality:**

Multi-question support with time restrictions.

Ability to skip questions and navigate between them.

A final submission button once all answers are completed.


⚙️ **Technologies Used**
Frontend:
  1)HTML5
  2)CSS3 (Bootstrap for responsive design)
  3)JavaScript (for frontend functionality).

Backend:
  Node.js (for server-side logic).

Database:
  Browser local database.


📄 **License**
This project is licensed under the MIT License - see the LICENSE file for details.



## User Interface

Here are some screenshots of the Quizy Proctor web app:

### Admin Login Page
![Admin Login Page](https://github.com/prathamesh0705/Quizy-proctor/blob/main/User%20Interface/Admin%20Login%20Page.png)

### Admin Dashboard
![Admin Dashboard](https://github.com/prathamesh0705/Quizy-proctor/blob/main/User%20Interface/Admin%20Dashboard.png)

### Admin SignUp Form
![Admin SignUp Form](https://github.com/prathamesh0705/Quizy-proctor/blob/main/User%20Interface/Admin%20SignUp%20form.png)

### Certificate(It can be generated in admin dashboard)
![Certificate](https://github.com/prathamesh0705/Quizy-proctor/blob/main/User%20Interface/Certificate.png)

### Student Login
![Student Login](https://github.com/prathamesh0705/Quizy-proctor/blob/main/User%20Interface/Student%20Login.png)

### Test Interface With the warning
![Test Interface](https://github.com/prathamesh0705/Quizy-proctor/blob/main/User%20Interface/Test%20Interface.png)

### Test Submit
![Test Submit](https://github.com/prathamesh0705/Quizy-proctor/blob/main/User%20Interface/Test%20Submit.png)

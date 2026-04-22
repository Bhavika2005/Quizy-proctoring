const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db"); // your db.js connection

const app = express();
app.use(cors());
app.use(bodyParser.json());

// =================================================================
// == BRAND & COMPANY ROUTES ==
// =================================================================

// ✅ Get all brand codes for homepage dropdown
app.get("/api/brands", (req, res) => {
    // CHANGED: column name to brand_code
    const sql = "SELECT brand_code FROM brands";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ ok: false, error: "Database error" });
        // To match frontend expectations, we map the result
        const mappedResults = results.map(item => ({ brandCode: item.brand_code }));
        res.json(mappedResults);
    });
});

// ✅ Get a specific brand's details
app.get("/api/brand/:brandCode", (req, res) => {
    const { brandCode } = req.params;
    // CHANGED: column names to snake_case
    const sql = "SELECT brand_name, address FROM brands WHERE brand_code = ?";
    db.query(sql, [brandCode], (err, results) => {
        if (err) return res.status(500).json({ ok: false, error: "Database error" });
        if (results.length > 0) {
            // Map to camelCase for frontend consistency
            const brandData = {
                brandName: results[0].brand_name,
                address: results[0].address
            };
            res.json({ ok: true, data: brandData });
        } else {
            res.status(404).json({ ok: false, error: "Brand not found" });
        }
    });
});

// ✅ Brand (Company) Registration
app.post("/api/register", (req, res) => {
    const { brandCode, brandName, website, contact, address, username, password } = req.body;
    // CHANGED: column names to snake_case
    const sql = "INSERT INTO brands (brand_code, brand_name, website, contact, address, username, password) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [brandCode, brandName, website, contact, address, username, password], (err, result) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.json({ ok: false, error: "Brand Code already taken" });
            }
            return res.status(500).json({ ok: false, error: "Database error" });
        }
        res.json({ ok: true });
    });
});

// ✅ Brand (Company) Login
app.post("/api/login", (req, res) => {
    const { brandCode, username, password } = req.body;
    // CHANGED: column name to brand_code
    const sql = "SELECT * FROM brands WHERE brand_code = ? AND username = ? AND password = ?";
    db.query(sql, [brandCode, username, password], (err, results) => {
        if (err) return res.status(500).json({ ok: false, error: "Database error" });
        if (results.length > 0) {
            res.json({ ok: true });
        } else {
            res.json({ ok: false, error: "Invalid credentials" });
        }
    });
});

// =================================================================
// == SUBJECT ROUTES ==
// =================================================================

// Get all subjects for a brand
app.get("/api/subjects/:brandCode", (req, res) => {
    const { brandCode } = req.params;
    const sql = "SELECT id, subject_name FROM subjects WHERE brand_code = ?";
    db.query(sql, [brandCode], (err, results) => {
        if (err) return res.status(500).json({ ok: false, error: "Database error" });
        const mappedResults = results.map(s => ({
            id: s.id,
            subjectName: s.subject_name
        }));
        res.json({ ok: true, data: mappedResults });
    });
});

// Add a new subject
app.post("/api/subjects", (req, res) => {
    const { brandCode, subjectName } = req.body;
    // This simple INSERT works because 'id' is now automatic
    const sql = "INSERT INTO subjects (brand_code, subject_name) VALUES (?, ?)";
    db.query(sql, [brandCode, subjectName], (err, result) => {
        if (err) {
            console.error("DATABASE ERROR:", err); // Keep for debugging
            return res.status(500).json({ ok: false, error: "Database error" });
        }
        res.json({ ok: true, insertId: result.insertId });
    });
});

// Update a subject
app.put("/api/subjects/:id", (req, res) => {
    const { id } = req.params;
    const { subjectName } = req.body;
    const sql = "UPDATE subjects SET subject_name = ? WHERE id = ?";
    db.query(sql, [subjectName, id], (err, result) => {
        if (err) return res.status(500).json({ ok: false, error: "Database error" });
        res.json({ ok: true });
    });
});

// Delete a subject
app.delete("/api/subjects/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM subjects WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ ok: false, error: "Database error" });
        res.json({ ok: true });
    });
});
// =================================================================
// == QUESTION ROUTES (No changes needed) ==
// =================================================================

// ✅ Get all questions for a specific subject of a brand
app.get("/api/questions/:brandCode/:subjectName", (req, res) => {
    const { brandCode, subjectName } = req.params;
    const sql = "SELECT * FROM questions WHERE brandCode = ? AND subjectName = ?";
    db.query(sql, [brandCode, subjectName], (err, results) => {
        if (err) return res.status(500).json({ ok: false, error: "Database error" });
        res.json({ ok: true, data: results });
    });
});

// ✅ Add a new question
app.post("/api/questions", (req, res) => {
    const { brandCode, subjectName, question, optionOne, optionTwo, optionThree, optionFour, correctAnswer } = req.body;
    const sql = "INSERT INTO questions (brandCode, subjectName, question, optionOne, optionTwo, optionThree, optionFour, correctAnswer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [brandCode, subjectName, question, optionOne, optionTwo, optionThree, optionFour, correctAnswer], (err, result) => {
        if (err) return res.status(500).json({ ok: false, error: "Database error" });
        res.json({ ok: true, insertId: result.insertId });
    });
});

// ✅ Update a question
app.put("/api/questions/:id", (req, res) => {
    const { id } = req.params;
    const { question, optionOne, optionTwo, optionThree, optionFour, correctAnswer } = req.body;
    const sql = "UPDATE questions SET question = ?, optionOne = ?, optionTwo = ?, optionThree = ?, optionFour = ?, correctAnswer = ? WHERE id = ?";
    db.query(sql, [question, optionOne, optionTwo, optionThree, optionFour, correctAnswer, id], (err, result) => {
        if (err) return res.status(500).json({ ok: false, error: "Database error" });
        res.json({ ok: true });
    });
});

// ✅ Delete a question
app.delete("/api/questions/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM questions WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ ok: false, error: "Database error" });
        res.json({ ok: true });
    });
});

// =================================================================
// == STUDENT (USER) ROUTES (No changes needed) ==
// =================================================================

// ✅ Get all registered users (students/guides) for a brand
app.get("/api/users", (req, res) => {
    const { brandCode } = req.query; // From query string: ?brandCode=...
    const sql = "SELECT * FROM registrations WHERE brandCode = ?";
    db.query(sql, [brandCode], (err, results) => {
        if (err) return res.status(500).json({ ok: false, error: "Database error" });
        res.json(results); // homepage.js expects a direct array
    });
});

// ✅ Get all registrations for the dashboard view
app.get("/api/registrations/:brandCode", (req, res) => {
    const { brandCode } = req.params;
    const sql = "SELECT * FROM registrations WHERE brandCode = ?";
    db.query(sql, [brandCode], (err, results) => {
        if (err) return res.status(500).json({ ok: false, error: "Database error" });
        res.json({ ok: true, data: results });
    });
});

// ✅ Register a new student/user
app.post("/api/registrations", (req, res) => {
    const { brandCode, name, fatherName, dob, userType, mobile, enrollment, password, address, profilePic } = req.body;
    const sql = "INSERT INTO registrations (brandCode, name, fatherName, dob, userType, mobile, enrollment, password, address, profilePic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [brandCode, name, fatherName, dob, userType, mobile, enrollment, password, address, profilePic], (err, result) => {
        if (err) {
             if (err.code === "ER_DUP_ENTRY") { // Assuming enrollment is a UNIQUE key
                return res.json({ ok: false, error: "Enrollment number already exists" });
            }
            return res.status(500).json({ ok: false, error: "Database error" });
        }
        res.json({ ok: true });
    });
});

// ✅ Update a registration
app.put("/api/registrations/:id", (req, res) => {
    const { id } = req.params;
    const { name, fatherName, dob, userType, mobile, enrollment, password, address, profilePic } = req.body;
    const sql = "UPDATE registrations SET name = ?, fatherName = ?, dob = ?, userType = ?, mobile = ?, enrollment = ?, password = ?, address = ?, profilePic = ? WHERE id = ?";
    db.query(sql, [name, fatherName, dob, userType, mobile, enrollment, password, address, profilePic, id], (err, result) => {
        if (err) return res.status(500).json({ ok: false, error: "Database error" });
        res.json({ ok: true });
    });
});

// ✅ Delete a registration
app.delete("/api/registrations/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM registrations WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ ok: false, error: "Database error" });
        res.json({ ok: true });
    });
});


// =================================================================
// == QUIZ & RESULT ROUTES
// =================================================================

// ======= UPDATED: Submit a quiz result (with attempt protection) =======
app.post("/api/results", (req, res) => {
    // CHANGED: Removed 'name' from the destructured variables in older version
    const { brandCode, enrollment, subject, rightAns, wrongAns, maxMark } = req.body;

    // First: check if this student already submitted for this subject & brand
    const checkSql = "SELECT * FROM results WHERE brandCode = ? AND subject = ? AND enrollment = ? LIMIT 1";
    db.query(checkSql, [brandCode, subject, enrollment], (checkErr, checkRows) => {
        if (checkErr) {
            console.error("DATABASE ERROR during result check:", checkErr);
            return res.status(500).json({ ok: false, error: "Database error" });
        }

        if (checkRows.length > 0) {
            // Student already attempted
            return res.json({ ok: false, error: "Test already attempted!" });
        }

        // If not attempted, insert new result
        const insertSql = "INSERT INTO results (brandCode, enrollment, subject, rightAns, wrongAns, maxMark) VALUES (?, ?, ?, ?, ?, ?)";
        db.query(insertSql, [brandCode, enrollment, subject, rightAns, wrongAns, maxMark], (err, result) => {
            if (err) {
                console.error("DATABASE ERROR during result submission:", err);
                return res.status(500).json({ ok: false, error: "Database error" });
            }
            res.json({ ok: true });
        });
    });
});

// ✅ Get results for a specific subject (with student names)
app.get("/api/results/:brandCode/:subject", (req, res) => {
    const { brandCode, subject } = req.params;
    
    // CHANGED: This query now JOINS the two tables to fetch the name
    const sql = `
        SELECT 
            reg.name, 
            r.enrollment, 
            r.subject, 
            r.rightAns, 
            r.wrongAns,  
            r.maxMark 
        FROM results r
        JOIN registrations reg ON r.enrollment = reg.enrollment AND r.brandCode = reg.brandCode
        WHERE r.brandCode = ? AND r.subject = ?
    `;

    db.query(sql, [brandCode, subject], (err, results) => {
        if (err) return res.status(500).json({ ok: false, error: "Database error" });
        res.json({ ok: true, data: results });
    });
});

// =================================================================
// == CERTIFICATE ROUTE ==
// =================================================================

// ✅ Get all results for a specific student for their certificate
app.get("/api/certificate/:brandCode/:enrollment", (req, res) => {
    const { brandCode, enrollment } = req.params;

    console.log(`[SERVER] Attempting to fetch certificate data for enrollment: ${enrollment}`);

    // Query joins results table with registrations to fetch student + result details
    const sql = `
        SELECT 
            r.subject, r.rightAns, r.wrongAns, r.maxMark,
            r.enrollment, r.brandCode,
            reg.name, reg.fatherName, reg.profilePic
        FROM results r
        JOIN registrations reg 
            ON r.enrollment = reg.enrollment 
            AND r.brandCode = reg.brandCode
        WHERE r.brandCode = ? AND r.enrollment = ?
    `;

    db.query(sql, [brandCode, enrollment], (err, results) => {
        if (err) {
            console.error("Database error on certificate query:", err);
            return res.status(500).json({ ok: false, error: "Database error" });
        }
        
        if (results.length === 0) {
            console.log(`[SERVER] No results found for enrollment: ${enrollment}`);
            return res.status(404).json({ ok: false, error: "No results found for this enrollment number." });
        }
        
        console.log(`[SERVER] Successfully found ${results.length} results for enrollment: ${enrollment}`);
        res.json({ ok: true, data: results });
    });
});

// ======= UPDATED: /api/checkAttempt using db.query (matches your db style) =======
app.get('/api/checkAttempt/:brandCode/:subject/:enrollment', (req, res) => {
    const { brandCode, subject, enrollment } = req.params;

    const query = "SELECT * FROM results WHERE brandCode = ? AND subject = ? AND enrollment = ? LIMIT 1";
    db.query(query, [brandCode, subject, enrollment], (err, rows) => {
        if (err) {
            console.error("DATABASE ERROR on checkAttempt:", err);
            return res.status(500).json({ error: "Server error checking attempt" });
        }

        if (rows.length > 0) {
            return res.json({ attempted: true });
        } else {
            return res.json({ attempted: false });
        }
    });
});

// =================================================================
// == SERVER START ==
// =================================================================

app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});

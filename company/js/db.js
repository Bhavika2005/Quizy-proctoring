const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",       // your MySQL username
  password: "123456",       // your MySQL password (keep empty if none)
  database: "quizy",  // your database name
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed: " + err.stack);
    return;
  }
  console.log("✅ Connected to MySQL as ID " + db.threadId);
});

module.exports = db;

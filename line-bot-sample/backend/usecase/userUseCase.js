import pool from "../infrastructure/database.js";

async function getUsers() {
  try {
    const res = await pool.query("SELECT * FROM users;");
    console.log(res.rows);
  } catch (err) {
    console.error("Database error:", err);
  }
}

getUsers();

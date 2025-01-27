const pg = require("pg");
const { Pool } = pg;

const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

pool
  .connect()
  .then((client) => {
    console.log("✅ Database connected successfully");
    client.release();
  })
  .catch((err) =>
    console.error(
      "❌ Database conndocker exec -it linebot_postgres error:",
      err
    )
  );

  module.exports = pool;
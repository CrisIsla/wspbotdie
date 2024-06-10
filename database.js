const sqlite3 = require("sqlite3").verbose();

function connectDB(dbFilePath) {
  let db = new sqlite3.Database(
    dbFilePath,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
        return;
      } else {
        console.log("Connected to the SQLite database.");
      }
    }
  );
  return db;
}

function createAnswersTable(db, total_questions) {
  let questions_id = [];
  for (let i = 0; i < total_questions; i++) {
    questions_id.push(`Q${i + 1}`);
  }

  let columnsDefinition = questions_id.map((col) => `${col} TEXT`).join(", ");

  query = `CREATE TABLE IF NOT EXISTS answers (
      number TEXT PRIMARY KEY,
      ${columnsDefinition}
    )`;
  console.log(query);
  db.run(query, (err) => {
    if (err) {
      console.log("Error creating table: ", err.message);
    } else {
      console.log("Table answers created succesfully.");
    }
  });
}

module.exports = {
  connectDB,
  createAnswersTable,
};

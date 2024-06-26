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
    questions_id.push(`Q${i}`);
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

function insertAnswer(db, number, answer, answer_number) {
  query = `INSERT INTO answers (number, Q${answer_number}) VALUES (?, ?) ON CONFLICT(number) DO UPDATE SET Q${answer_number} = ? WHERE number = ?`;

  db.run(query, [number, answer, answer, number], function (err) {
    if (err) {
      console.error("Error inserting data:", err.message);
    } else {
      console.log(`Row inserted with number: ${number}`);
    }
  });
}

function printAnswersTable(db) {
  query = `SELECT * FROM answers`;
  db.all(query, [], (err, rows) => {
    if (err) {
      throw err;
    }
    // Print the retrieved rows
    rows.forEach((row) => {
      console.log(row);
    });
  });
}

module.exports = {
  connectDB,
  createAnswersTable,
  insertAnswer,
  printAnswersTable,
};

const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const sqlite3 = require("sqlite3").verbose();
const numbers = require("./numbers.json");
const bot_messages = require("./questions.json");

const TOTAL_QUESTIONS = bot_messages.questions.length;

let db = new sqlite3.Database(
  "./answers.db",
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
      return;
    } else {
      console.log("Connected to the SQLite database.");
      createAnswersTable(TOTAL_QUESTIONS);
    }
  }
);

function createAnswersTable(total_questions) {
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

let answers = {};

// Create a new client instance
const client = new Client();

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log("Client is ready!");

  async function sendInitialMessage() {
    for (let i = 0; i < numbers.length; i++) {
      client.sendMessage(numbers[i], bot_messages["welcome-message"]);
      answers[numbers[i]] = {
        sent_first_question: false,
        answers: [],
        is_done: false,
      };
    }
  }
  sendInitialMessage();
});

// When the client received QR-Code
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

// Listening to all incoming messages
client.on("message", (message) => {
  function formulateQuestion(question_json) {
    let question = question_json.question;
    if (question_json.type == "multiple-choice") {
      for (let i = 0; i < question_json.options.length; i++) {
        question +=
          "\n- " +
          String.fromCharCode(97 + i) +
          ") " +
          question_json.options[i];
      }
    }
    return question;
  }

  function getQuestionChoices(question_options) {
    question_choices = [];
    for (let i = 0; i < question_options.length; i++) {
      question_choices.push(String.fromCharCode(97 + i));
    }
    return question_choices;
  }

  function surveyLogic() {
    if (message.body == "" || answers[message.from].is_done) return;
    console.log("Message received:", message.body);
    let response;
    if (!answers[message.from].sent_first_question) {
      response = formulateQuestion(bot_messages.questions[0]);
      client.sendMessage(message.from, response);
      console.log(message.from);
      console.log("Message sent:", response);
      answers[message.from].sent_first_question = true;
      return;
    }
    total_answers = answers[message.from].answers.length;
    last_question = bot_messages.questions[total_answers];
    if (
      last_question.type != "text" &&
      !getQuestionChoices(last_question.options).includes(
        message.body.toLowerCase()
      )
    )
      response = bot_messages.invalid;
    else {
      if (last_question === bot_messages.questions[TOTAL_QUESTIONS - 1]) {
        response = bot_messages["end-message"];
        answers[message.from].answers.push(message.body);
        answers[message.from].is_done = true;
      } else {
        total_answers += 1;
        response = formulateQuestion(bot_messages.questions[total_answers]);
        answers[message.from].answers.push(message.body);
      }
    }
    client.sendMessage(message.from, response);
    console.log(message.from);
    console.log("Message sent:", response);
  }
  surveyLogic();
});

// Start your client
client.initialize();

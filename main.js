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
    }
  }
);

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
    total_answers = answers[message.from].answers.length;
    if (total_answers == 0) {
      last_question = bot_messages["welcome-message"];
    } else {
      last_question = bot_messages.questions[total_answers - 1];
    }
    let response;
    if (total_answers == TOTAL_QUESTIONS) {
      response = bot_messages["end-message"];
      answers[message.from].is_done = true;
    } else if (
      last_question == bot_messages["welcome-message"] ||
      last_question.type == "text" ||
      getQuestionChoices(last_question.options).includes(
        message.body.toLowerCase()
      )
    ) {
      response = formulateQuestion(bot_messages.questions[total_answers]);
      answers[message.from].answers.push(message.body);
    } else {
      response = bot_messages.invalid;
    }
    client.sendMessage(message.from, response);
    console.log(message.from);
    console.log("Message sent:", response);
  }
  surveyLogic();
});

// Start your client
client.initialize();

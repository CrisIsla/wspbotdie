const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const numbers = require("./numbers.json");
const bot_messages = require("./questions.json");
const {
  connectDB,
  createAnswersTable,
  insertAnswer,
  printAnswersTable,
} = require("./database");
const { getQuestionChoices, formulateQuestion } = require("./utils");
const { getSelectedChoice } = require("./ai");

const TOTAL_QUESTIONS = bot_messages.questions.length;

let db = connectDB("./answers.db");

createAnswersTable(db, TOTAL_QUESTIONS);

let answers = {};

// Create a new client instance
const client = new Client({
  puppeteer: {
    headless: true,
    args: ["--headless", "--no-sandbox", "--disable-setuid-sandbox"],
  },
});

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
  async function surveyLogic() {
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
    let total_answers = answers[message.from].answers.length;
    let last_question = bot_messages.questions[total_answers];
    let selected_choice = message.body;
    let is_answer_valid = true;
    if (
      last_question.type != "text" &&
      !getQuestionChoices(last_question.options).includes(
        selected_choice.toLowerCase()
      )
    ) {
      await client.sendMessage(message.from, "Interpretando respuesta...");
      selected_choice = await getSelectedChoice(last_question, selected_choice);
      if (
        !getQuestionChoices(last_question.options).includes(
          selected_choice.toLowerCase()
        )
      ) {
        is_answer_valid = false;
        response = bot_messages.invalid;
      } else {
        await client.sendMessage(
          message.from,
          `Su respuesta se interpreto como la alternativa: ${selected_choice.toUpperCase()}`
        );
      }
    }
    if (is_answer_valid) {
      answers[message.from].answers.push(selected_choice);
      insertAnswer(db, message.from, selected_choice, total_answers);
      if (last_question === bot_messages.questions[TOTAL_QUESTIONS - 1]) {
        response = bot_messages["end-message"];
        answers[message.from].is_done = true;
      } else {
        response = formulateQuestion(bot_messages.questions[total_answers + 1]);
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

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
const { getQuestionChoices, formulateQuestion, setTimer } = require("./utils");
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

async function surveyLogic(message) {
  if (!numbers.includes(message.from) || message.body == "" || answers[message.from].is_done) return;
  console.log("Message received:", message.body);
  let response;
  if (!answers[message.from].sent_first_question) {
    response = formulateQuestion(bot_messages.questions[0]);
    client.sendMessage(message.from, response);
    console.log("Message sent:", response);
    answers[message.from].sent_first_question = true;
    return;
  }
  let total_answers = answers[message.from].answers.length;
  let last_question = bot_messages.questions[total_answers];
  let selected_choice = message.body.toLowerCase();
  let is_answer_valid = true;
  if (
    last_question.type == "multiple-choice" &&
    !getQuestionChoices(last_question.options).includes(
      selected_choice.toLowerCase()
    )
  ) {
    await message.react("🤔");
    await setTimer(1000);
    let interpretation_message = await client.sendMessage(message.from, "Interpretando respuesta...");
    selected_choice = await getSelectedChoice(last_question, selected_choice);
    if (
      !getQuestionChoices(last_question.options).includes(
        selected_choice.toLowerCase()
      )
    ) {
      is_answer_valid = false;
      response = bot_messages.invalid;
    } else {
      await setTimer(1500);
      await interpretation_message.edit(
        `Su respuesta se interpreto como la alternativa: ${selected_choice.toLowerCase()}`
      );
    }
  }
  if (is_answer_valid) {
    await message.react("👍");
    answers[message.from].answers.push(selected_choice);
    insertAnswer(db, message.from, selected_choice, total_answers);
    while (true) {
      if (last_question === bot_messages.questions[TOTAL_QUESTIONS - 1]) {
        response = bot_messages["end-message"];
        answers[message.from].is_done = true;
        break;
      } else {
        let depends = bot_messages.questions[total_answers + 1].depends;
        if (!depends) {
          response = formulateQuestion(bot_messages.questions[total_answers + 1]);
          break;
        }
        let depends_on = bot_messages.questions[total_answers + 1].depends_on;
        let depends_answers = bot_messages.questions[total_answers + 1].depends_answers;
        if (depends_answers.includes(answers[message.from].answers[depends_on])) {
          response = formulateQuestion(bot_messages.questions[total_answers + 1]);
          break;
        }
        else {
          answers[message.from].answers.push(NaN);
          total_answers += 1;
          insertAnswer(db, message.from, "No aplica", total_answers);
          last_question = bot_messages.questions[total_answers];
        }
      }
    }
  }

  await setTimer(2000);
  client.sendMessage(message.from, response);
  console.log("Message sent:", response);
}

async function sendInitialMessage() {
  for (let i = 0; i < numbers.length; i++) {
    answers[numbers[i]] = {
      sent_first_question: false,
      answers: [],
      is_done: false,
    };
    await client.sendMessage(numbers[i], bot_messages["welcome-message"]);
    response = formulateQuestion(bot_messages.questions[0]);
    await setTimer(2000);
    await client.sendMessage(numbers[i], response);
    answers[numbers[i]].sent_first_question = true;
    await setTimer(18000);
  }
}

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log("Client is ready!");
  sendInitialMessage();
});

// When the client received QR-Code
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

// Listening to all incoming messages
client.on("message", (message) => {
  surveyLogic(message);
});

// Start your client
client.initialize();

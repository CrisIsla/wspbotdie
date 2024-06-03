const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const numbers = require("./numbers.json");
const bot_messages = require("./questions.json");

const answers = ["a", "b", "c", "d", "e"];

// Create a new client instance
const client = new Client();

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log("Client is ready!");

  async function sendInitialMessage() {
    for (let i = 0; i < numbers.length; i++) {
      client.sendMessage(numbers[i], bot_messages["welcome-message"]);
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
  async function getChat(own_messages) {
    const chat = await message.getChat();
    const messages = await chat.fetchMessages({ fromMe: own_messages });
    const messages_body = messages.map((msg) => msg.body);
    return messages_body;
  }

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

  function getFirstLine(question) {
    return question.split("\n")[0];
  }

  async function surveyLogic() {
    if (message.body == "") return;
    console.log("Message received:", message.body);
    try {
      const messages = (await getChat(true)).map(getFirstLine);
      console.log(messages);
      let last_question = bot_messages["welcome-message"];
      for (let i = 0; i < bot_messages.questions.length; i++) {
        if (messages.includes(bot_messages.questions[i].question)) {
          last_question = bot_messages.questions[i];
          continue;
        }
        let response;
        if (
          last_question == bot_messages["welcome-message"] ||
          answers.includes(message.body.toLowerCase()) ||
          last_question.type == "text"
        ) {
          response = formulateQuestion(bot_messages.questions[i]);
        } else {
          response = bot_messages.invalid;
        }
        client.sendMessage(message.from, response);
        console.log(message.from);
        console.log("Message sent:", response);
        break;
      }
    } catch (error) {
      console.log(error);
      surveyLogic();
    }
  }

  async function clearChat() {
    const chat = await message.getChat();
    await chat.clearMessages();
    console.log(chat);
  }
  surveyLogic();
  // clearChat();
});

// Start your client
client.initialize();

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
  async function getChat(own_messages = false) {
    const chat = await message.getChat();
    const messages = await chat.fetchMessages(own_messages);
    const messages_body = messages.map((msg) => msg.body);
    return messages_body;
  }

  async function surveyLogic() {
    if (message.body == "") return;
    console.log("Message received:", message.body);
    try {
      const messages = await getChat(true);
      let last_question;
      for (let i = 0; i < bot_messages.questions.length; i++) {
        if (messages.includes(bot_messages.questions[i])) {
          last_question = questions[i];
          continue;
        }
        let response;
        if (
          answers.includes(message.body.toLowerCase()) ||
          last_question.type == "text"
        ) {
          response = value;
        } else {
          response = "That's not a valid answer. Please, try again.";
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

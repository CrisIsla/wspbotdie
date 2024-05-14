const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const questions = {
  welcome:
    "Welcome to the survey.\nPlease answer questions 1 and 2 with (a, b, c, d, e).\nQuestion 3 is free to answer with anything.\nAnswer to this message to start :)",
  q1: "Question1",
  q2: "Question2",
  q3: "Question3",
  end: "We are done :). Thanks for your time",
};

const answers = ["a", "b", "c", "d", "e"];

// Create a new client instance
const client = new Client();

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log("Client is ready!");
});

// When the client received QR-Code
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

// Listening to all incoming messages
client.on("message_create", (message) => {
  async function getChat() {
    const chat = await message.getChat();
    const messages = await chat.fetchMessages();
    const messages_body = messages.map((msg) => msg.body);
    return messages_body;
  }

  async function surveyLogic() {
    if (!message.fromMe && message.body != "") {
      console.log("Message received:", message.body);
      try {
        const messages = await getChat();
        for (const [key, value] of Object.entries(questions)) {
          if (!messages.includes(value)) {
            let response;
            if (
              answers.includes(message.body.toLowerCase()) ||
              key == "q1" ||
              key == "end"
            ) {
              response = value;
            } else {
              response = "That's not a valid answer. Please, try again.";
            }
            client.sendMessage(message.from, response);
            console.log("Message sent:", response);
            break;
          }
        }
      } catch (error) {
        console.log(error);
        surveyLogic();
      }
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

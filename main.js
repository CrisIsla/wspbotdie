const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

require("dotenv").config();

const questions = {
  welcome:
    "Hola, soy Cristobal. Bienvenido/a a mi encuesta sobre comida.\nPor favor contesta las preguntas de alternativas enviando una de las siguientes opciones (a, b, c, d, e).\nEl resto de preguntas se puede responder libremente.\nResponde a este mensaje para comenzar :).",
  q1: "Cual es tu comida favorita? \na) Papas Frita\nb) Pizza\nc) Hamburguesa\nd) Completos\ne) Ninguna de las anteriores",
  q2: "Cual es tu bebida favorita? \na) Agua\nb) Jugo de naranja\nc) Coca-Cola\nd) Cerveza\ne) Ninguna de las anteriores",
  q3: "Que es lo que mas te gusta de tu comida favorita?",
  end: "Se han guardado tus respuestas. Muchas gracias por participar :).",
  invalid:
    "Esa no es una respuesta valida. Recuerda responder con alguna de las alternativas (a, b, c, d, e)",
};

const answers = ["a", "b", "c", "d", "e"];

const numbers = process.env.TEST_NUMBERS.split(",");

// Create a new client instance
const client = new Client();

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log("Client is ready!");

  async function sendInitialMessage() {
    for (let i = 0; i < numbers.length; i++) {
      client.sendMessage(numbers[i], questions.welcome);
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
      let last_question_key;
      for (const [key, value] of Object.entries(questions)) {
        if (messages.includes(value)) {
          last_question_key = key;
        }
        let response;
        if (
          answers.includes(message.body.toLowerCase()) ||
          last_question_key == "welcome" ||
          last_question_key == "q3"
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

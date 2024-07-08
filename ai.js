const OpenAI = require("openai");
const { formulateQuestion } = require("./utils");
require("dotenv/config");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function createSystemQuery(question_json) {
  let query = `Eres un entrevistador. La pregunta que le haces al usuario es la siguiente:\n`;
  query += formulateQuestion(question_json);
  query += `\nTu mision es interpretar la respuesta que te de el usuario para que calce con alguna de las alternativas de la pregunta que le estas haciendo. Tu respuesta debe ser la letra de la alternativa escogida. Nada mas que la letra (en minusculas). En caso de que el mensaje no calce con ninguna de las alternativas, entonces deberas responder error.`;
  return query;
}

async function getSelectedChoice(question_json, message) {
  conversation = [
    {
      role: "system",
      content: createSystemQuery(question_json),
    },
    {
      role: "user",
      content: message,
    },
  ];
  const completion = await openai.chat.completions.create({
    messages: conversation,
    model: "gpt-3.5-turbo",
  });

  return completion.choices[0].message.content;
}

module.exports = {
  getSelectedChoice,
};

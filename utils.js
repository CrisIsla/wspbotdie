function getQuestionChoices(question_options) {
  question_choices = [];
  for (let i = 0; i < question_options.length; i++) {
    question_choices.push(String.fromCharCode(97 + i));
  }
  return question_choices;
}

function formulateQuestion(question_json) {
  let question = question_json.question;
  if (question_json.type == "multiple-choice") {
    for (let i = 0; i < question_json.options.length; i++) {
      question +=
        "\n- " + String.fromCharCode(97 + i) + ") " + question_json.options[i];
    }
  }
  return question;
}

module.exports = {
  getQuestionChoices,
  formulateQuestion,
};

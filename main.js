const { Client } = require('whatsapp-web.js'); 
const qrcode = require('qrcode-terminal')

const questions = ["Question1", "Question2", "Question3", "Thanks for your time"]

// Create a new client instance
const client = new Client();

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Client is ready!');
});

// When the client received QR-Code
client.on('qr', (qr) => {
    qrcode.generate(qr, {'small': true});
});

// Listening to all incoming messages
client.on('message_create', message => {
    async function getChat() {
        var chat = await message.getChat();
        var messages = await chat.fetchMessages();
        var messages_body = (await messages).map((msg) => msg.body);
        return messages_body;
    }

    async function surveyLogic() {
        if (!message.fromMe){
            const messages = await getChat();
            // console.log(messages)
            
            for(let i=0; i<questions.length; i++){
                if(!messages.includes(questions[i])){
                    console.log("Se envio el mensaje")
                    client.sendMessage(message.from, questions[i]);
                    break;
                }
            }
        }
    }

    async function clearChat() {
        var chat = await message.getChat();
        await chat.clearMessages();
        console.log(chat);
    } 
    surveyLogic();
});

// Start your client
client.initialize();

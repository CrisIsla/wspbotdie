const { Client } = require('whatsapp-web.js'); 
const qrcode = require('qrcode-terminal')

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
        var chat = (await message.getChat()).fetchMessages();
        var messages = (await chat).map((msg) => msg.body);
        return messages;
    }
    messages = getChat()
});

// Start your client
client.initialize();

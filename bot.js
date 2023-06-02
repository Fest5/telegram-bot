const TelegramBot = require('node-telegram-bot-api');
const {db} = require("./firebase")
const { ref, set } = require("firebase/database");

const newItem = {
    title: 'Buy groceries',
    description: 'Milk, eggs, bread',
  };
  
function saveUserId(chatId) {
  set(ref(db, 'users/' + chatId), {
    id: chatId,
  });
}

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Event listener for when a user sends a message to the bot
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (msg.text.toString().toLowerCase() == 'hi')  {
    console.log('a')
    bot.sendMessage(msg.from.id, "Hello " + msg.from.first_name + ' cutie.');
    saveUserId(chatId)
  }

  console.log('mensaje recibido')
  // Process the received message and send a response
  // Add your logic here based on your bot's functionality
  // Example: Echo the user's message
  bot.sendMessage(chatId, `You said: ${messageText}`);
});

bot.onText(/\/start/, (msg) => {

    bot.sendMessage(msg.chat.id, "Welcome", {
    "reply_markup": {
        "keyboard": [["Ver Tareas"],   ["Completar Tarea"], ["Borrar Tarea"], ["Cancelar"]]
        }
    });
    
});



// Start the bot
bot.on('polling_error', (error) => {
  console.log(`Polling error: ${error}`);
});

console.log('Bot has started...');

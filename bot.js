const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const {database} = require('./firebase');

/* console.log(database)

const newItem = {
    title: 'Buy groceries',
    description: 'Milk, eggs, bread',
  };
  
const todoRef = database.ref('todos');
todoRef.push(newItem)
.then(() => {
    console.log('New to-do item saved.');
})
.catch((error) => {
    console.error('Error saving to-do item:', error);
}); */

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Event listener for when a user sends a message to the bot
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (msg.text.toString().toLowerCase() == 'hi')  {
    console.log('a')
    bot.sendMessage(msg.from.id, "Hello " + msg.from.first_name + ' cutie.');
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

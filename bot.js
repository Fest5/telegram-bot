const TelegramBot = require('node-telegram-bot-api');
const { randomUUID } = require('crypto');
const {getTasks, completeTask, createTask} = require('./functions')

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Event listener for when a user sends a message to the bot
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (msg.text.toString().toLowerCase() == 'hi')  {
    bot.sendMessage(msg.from.id, "Hello " + msg.from.first_name + ' cutie.');
    bot.sendMessage(msg.chat.id, "Welcome", {
      "reply_markup": {
          "keyboard": [["Ver Tareas"],   ["Crear Tarea"], ["Completar Tarea"], ["Cancelar"]]
          }
      });
  }

  if (msg.text.toString().toLowerCase() == 'juan')  {
    bot.sendMessage(msg.from.id, "Hola " + msg.from.first_name + ', morrito.');
  }

  if (msg.text.toString().toLowerCase() == 'puto')  {
    bot.sendMessage(msg.from.id, "Qué mierda te pasa?")
  }

  if (msg.text.toString().toLowerCase() == 'Ver Tareas' || msg.text == '/list')  {
    const chatId = msg.chat.id;
    const allTasks = await getTasks(chatId.toString(), 'pending')
    if(allTasks.length === 0) {
      bot.sendMessage(msg.chat.id, `No tienes ninguna tarea pendiente.`);
      return;
    }
    let formatedList = '';
    allTasks.forEach((task) => {
      const item = `${task.name}\n`
      formatedList += item
    });

    console.log('tasks', formatedList)

    bot.sendMessage(msg.chat.id, `${formatedList}`);
  }

  console.log('mensaje recibido:', messageText)

})

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome", {
    "reply_markup": {
        "keyboard": [["Ver Tareas"],   ["Crear Tarea"], ["Completar Tarea"], ["Cancelar"]]
        }
    });
});

// Create new task

bot.onText(/\/create/, async (msg) => {
  const messageText = msg.text;
  const chatId = msg.chat.id;

  let taskName = messageText.split(' ')
  if(taskName.length == 1) {
    bot.sendMessage(chatId, "Error, no recibí el nombre de la tarea, solo el comando. Puedes responder a este mensaje con el nombre de la tarea.").then((sentMessage) => {
      // Guarda el ID del mensaje enviado para utilizarlo como referencia en la respuesta
      const messageID = sentMessage.message_id;

      // Espera la respuesta del usuario utilizando el evento onReplyToMessage
      bot.onReplyToMessage(chatId, messageID, (reply) => {
        const taskName = reply.text; // Obtiene el texto de la respuesta del usuario
        createTask(chatId.toString(), taskName)
        // Aquí puedes realizar las acciones necesarias con el nombre de la tarea
        // Por ejemplo, guardarla en una base de datos o realizar alguna otra operación

        bot.sendMessage(chatId, `Has creado la tarea: ${taskName}`);
      });
    });;
    return;
  }
  taskName.shift()
  taskName = taskName.join(" ")
 
  const newTaskStatus = await createTask(chatId.toString(), taskName)

  if(!newTaskStatus === 'success') {
    bot.sendMessage(chatId, "Error al crear la tarea");
  }
  bot.sendMessage(chatId, `Se creo la tarea: ${taskName}`)
});

// Handler for the '/complete' command
bot.onText(/\/complete/, async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // Retrieve the list of tasks for the user
  const userTasks = await getTasks(chatId.toString(), 'pending');

  // Validates the user has tasks
  if (userTasks.length === 0) {
    bot.sendMessage(msg.chat.id, 'You have no tasks to complete.');
    return;
  }
  
  // Separate the command and the task name
  let messageSeparated = messageText.split(' ');

  if (messageSeparated.length > 1 && messageSeparated[0] === '/complete' ) {
    // If the user has provided a task name, complete it
    messageSeparated.shift();
    const taskName = messageSeparated.join(' '); // CORREGIR ERROR ACA
    const task = userTasks.find((task) => task.name === taskName);

    console.log(task)

    if (task) {
      await completeTask(chatId.toString(), task.id.toString());
      bot.sendMessage(msg.chat.id, `Task ${taskName} completed!`);
    } else {
      bot.sendMessage(msg.chat.id, `Task ${taskName} not found!`);
    }
    return;
  } else {
    // If the user has not provided a task name, show a list of tasks to complete
    
     // Format the list of tasks as buttons
    const taskButtons = userTasks.map((task) => [`/complete ${task.name}`]);

    // Send the list of tasks as a message with reply keyboard markup
    bot.sendMessage(msg.chat.id, 'Please select a task to complete:', {
      reply_markup: {
        keyboard: taskButtons,
        one_time_keyboard: true
      }
    });
  }
});

// Ver info de tarea

// Start the bot
bot.on('polling_error', (error) => {
  console.log(`Polling error: ${error}`);
});

console.log('Bot has started...');

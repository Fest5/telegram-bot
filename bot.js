const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const {getTasks, completeTask, createTask, setReminder} = require('./services')
const {formatTaskList} = require('./utils')

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Functions
async function sendTaskList(chatId, reminder) {
  const allTasks = await getTasks(chatId.toString(), 'pending')

  if(allTasks.length === 0) {
    bot.sendMessage(chatId, `You have no pending tasks.`);
    return;
  }

  const markdownFormattedList = formatTaskList(allTasks, reminder)

  bot.sendMessage(chatId, markdownFormattedList, { parse_mode: 'Markdown' });
  return;
}

async function newTask(chatId, messageText) {
  const taskName = messageText.substring('/create'.length).trim();
  // Check if the task name contains a command
  if (/\/\w+/i.test(taskName)) {
    bot.sendMessage(chatId, 'Task names cannot contain commands.');
    return;
  }

  if(!taskName) {
    bot.sendMessage(chatId, "Error, no recibí el nombre de la tarea, solo el comando. Debes escribir el nombre de la tarea luego del comando /create")
    return;
  }

  const newTaskStatus = await createTask(chatId.toString(), taskName)

  if(!newTaskStatus === 'success') {
    bot.sendMessage(chatId, "Error al crear la tarea");
    return;
  }
  bot.sendMessage(chatId, `Se creo la tarea: ${taskName}`)
  return;
}

async function completeTask (chatId, messageText, userTasks) {
  // Separate the command and the task name
  const taskName = messageText.substring('/complete'.length).trim();

  if (taskName) {
    // If the user has provided a task name, complete it
    const task = userTasks.find((task) => task.name === taskName);

    console.log(task)

    if (task) {
      await completeTask(chatId.toString(), task.id.toString());
      bot.sendMessage(chatId, `Task ${taskName} completed!`);
    } else {
      bot.sendMessage(chatId, `Task ${taskName} not found!`);
    }
    return;
  } else {
    // If the user has not provided a task name, show a list of tasks to complete
    
    // Format the list of tasks as buttons
    const taskButtons = userTasks.map((task) => [`/complete ${task.name}`]);

    // Send the list of tasks as a message with reply keyboard markup
    bot.sendMessage(chatId, 'Please select a task to complete:', {
      reply_markup: {
        keyboard: taskButtons,
        one_time_keyboard: true
      }
    });
    return;
  }
}

async function createReminder (chatId, messageText) {
  const hour = parseInt(messageText.substring('/reminder'.length).trim()); 
  if (!hour) {
    bot.sendMessage(chatId, `You need to specify the hour for the list reminder after the /reminder.`);
    return;
  }
  if (hour >= 0 && hour <= 23) {
    // Save reminder in DB
    setReminder(chatId.toString(), hour)

    // Schedule the reminder task
    scheduleReminder(chatId, hour);

    bot.sendMessage(chatId, `Reminder set for ${hour}:00 every day (Argentina Time Zone).`);
    return;
  } else {
    // Invalid hour, send an error message
    bot.sendMessage(chatId, 'Invalid hour. Please provide a number between 0 and 23.');
  }
}

// Schedule the task to run at the specified hour every day
function scheduleReminder(chatId, hour) {
  cron.schedule(`0 ${hour} * * *`, () => {
    sendTaskList(chatId, true);
  });
}

// ---------------------------------------------------------------------------------

// Event listener for when a user sends a message to the bot

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // View task list

  if (messageText.startsWith('/list'))  {
    await sendTaskList(chatId)
    return;
  }

  // Create task

  if (messageText.startsWith('/create')) {
    await newTask(chatId, messageText)
    return;
  }

  // View tasks

  if (messageText.startsWith('/complete')) {
    // Retrieve the list of tasks for the user
    const userTasks = await getTasks(chatId.toString(), 'pending');

    // Validates the user has tasks
    if (userTasks.length === 0) {
      bot.sendMessage(chatId, 'You have no tasks to complete.');
      return;
    }
    
    await completeTask(chatId, messageText, userTasks)
    return;
  }

  // Set reminder

  if (messageText.startsWith('/reminder'))  {
    await createReminder(chatId, messageText)
    return;
  }

  // If the message isn't a command

  bot.sendMessage(chatId, "Sorry, I didn't understand that command. Please try again.");

  console.log('mensaje recibido:', messageText)

})

// Start the bot
bot.on('polling_error', (error) => {
  console.log(`Polling error: ${error}`);
});

console.log('Bot has started...');

const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const winston = require('winston');
const {getTasks, completeTask, createTask, setReminder} = require('./services')
const {formatTaskList} = require('./utils')

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const logger = winston.createLogger({
  level: 'info', // Set the desired log level
  format: winston.format.simple(), // Set the log format
  transports: [
    new winston.transports.Console(), // Output logs to the console
    // Add more transports if needed, such as writing logs to a file
  ],
});

let scheduledReminder;


// Functions
async function sendTaskList(chatId, reminder) {
  const allTasks = await getTasks(chatId.toString(), 'pending')

  if(allTasks.length === 0) {
    bot.sendMessage(chatId, `You don't have pending tasks.`);
    return;
  }

  const markdownFormattedList = formatTaskList(allTasks, reminder)

  bot.sendMessage(chatId, markdownFormattedList, { parse_mode: 'Markdown' });
  logger.info(`List sent to ${chatId}, with ${markdownFormattedList}`)
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
    bot.sendMessage(chatId, "Error, i didn't receive the task name, just the command. You must write the task name after the /create command.")
    return;
  }

  const newTaskStatus = await createTask(chatId.toString(), taskName)

  if(newTaskStatus == 'success') {
    bot.sendMessage(chatId, `The task was created with the name: ${taskName}.`)
    logger.info(`Created new task for user ${chatId}: ${taskName}`)
    return;
  }

  bot.sendMessage(chatId, "Error creating the task.");
  logger.error(`Error at creating task. Service status: ${newTaskStatus}`)
  return;
  
}

async function concludeTask (chatId, messageText, userTasks) {
  // Separate the command and the task name
  const taskName = messageText.substring('/complete'.length).trim();

  if (taskName) {
    // If the user has provided a task name, complete it
    const task = userTasks.find((task) => task.name === taskName);

    if (task) {
      await completeTask(chatId.toString(), task.id.toString());
      bot.sendMessage(chatId, `Task ${taskName} completed!`);
      logger.info(`Task completed for ${chatId}: ${taskName}`)
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

    bot.sendMessage(chatId, `Reminder set for ${hour}:00 every day (USA Time Zone).`);
    logger.info(`Reminder set for ${chatId} at ${hour}`)
    return;
  } else {
    // Invalid hour, send an error message
    bot.sendMessage(chatId, 'Invalid hour. Please provide a number between 0 and 23.');
  }
}

async function deleteReminder (chatId) {
  if(scheduledReminder) {
    scheduledReminder.stop()
    scheduledReminder = null
    bot.sendMessage(chatId, `The reminder was stopped`);
    logger.info(`Reminder stopped for ${chatId}`)
    return;
  } else {
    bot.sendMessage(chatId, `There wasn't a reminder set.`);
    return;
  }
 
}

// Schedule the task to run at the specified hour every day
function scheduleReminder(chatId, hour) {
  scheduledReminder = cron.schedule(`0 ${hour} * * *`, () => {
    sendTaskList(chatId, true);
  });
}

// ---------------------------------------------------------------------------------

// Event listener for when a user sends a message to the bot

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  logger.log('info', `Message received: ${messageText}`)

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
    
    await concludeTask(chatId, messageText, userTasks)
    return;
  }

  // Set reminder

  if (messageText.startsWith('/reminder'))  {
    await createReminder(chatId, messageText)
    return;
  }

  if (messageText.startsWith('/stop'))  {
    await deleteReminder(chatId, messageText)
    return;
  }

  if(messageText.toLowerCase() == 'hi' || messageText.toLowerCase() == 'hello') {
    bot.sendMessage(chatId, `Hello ${msg.from.first_name}. I'm happy to assist you!`);
    return;
  }

  // If the message isn't a command

  bot.sendMessage(chatId, "Sorry, I didn't understand that command. Please try again.");

})

// Start the bot
bot.on('polling_error', (error) => {
  console.log(`Polling error: ${error}`);
});

bot.on('webhook_error', (error) => {
  console.log(`Webhook error: ${error.code}`);  // => 'EPARSE'
});

console.log('Bot has started...');

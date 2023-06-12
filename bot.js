const TelegramBot = require('node-telegram-bot-api');
const { db } = require("./firebase")
const { randomUUID } = require('crypto');

// Function to get tasks for a specific user
async function getTasks(userId) {
  const tasks = await db.collection('users').doc(userId).collection('tasks').get();
  let allTasks = []
  tasks.forEach((doc) => {
    allTasks.push(doc.data())
  });
  return allTasks
}

// Function to create a task for a specific user
async function createTask(userId, taskName) {
  const userRef = db.collection('users').doc(userId);
  const newTaskRef = userRef.collection('tasks').doc();

  await newTaskRef.set({
    name: taskName,
    status: 'pending'
  })
  console.log('se creo')
  
}

// Function to mark a task as complete for a specific user
/* function completeTask(userId, taskId) {
  const taskRef = db.collection('tasks').doc(userId).collection('userTasks').doc(taskId);

  return taskRef.update({ status: 'completed' })
    .then(() => {
      console.log('Task marked as completed');
    })
    .catch((error) => {
      console.error('Error completing task:', error);
      throw error;
    });
} */

// Function to delete a task for a specific user
/* function deleteTask(userId, taskId) {
  const taskRef = db.collection('tasks').doc(userId).collection('userTasks').doc(taskId);

  return taskRef.delete()
    .then(() => {
      console.log('Task deleted successfully');
    })
    .catch((error) => {
      console.error('Error deleting task:', error);
      throw error;
    });
} */

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Event listener for when a user sends a message to the bot
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (msg.text.toString().toLowerCase() == 'hi')  {
    saveUserId(chatId)
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
  taskName.shift()
  taskName = taskName.join(" ")
 
  const newTaskId = await createTask(chatId.toString(), taskName)
  if(!newTaskId) {
    bot.sendMessage(chatId, "Error al crear la tarea");
  }
  bot.sendMessage(chatId, `Se creo la tarea: ${taskName} con id ${newTaskId}`)
});

// Crear tarea on reply

bot.onText(/Crear Tarea/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Reponse a este mensaje con el nombre de la tarea que deseas crear")
    .then((sentMessage) => {
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
    });
});

// View tasks that are pending

bot.onText(/Ver Tareas/, async (msg) => {
  const chatId = msg.chat.id;
  const allTasks = await getTasks(chatId.toString())
  console.log(allTasks)
  let formatedList = '';
  allTasks.forEach((task, i) => {
    if(task.status == 'pending') {
      const item = `${i + 1}. ${task.name}\n`
      formatedList += item
    }
  })
  bot.sendMessage(msg.chat.id, `${formatedList}`);
});

// Completar tarea



// Borrar tarea



// Ver info de tarea

// Start the bot
bot.on('polling_error', (error) => {
  console.log(`Polling error: ${error}`);
});

console.log('Bot has started...');

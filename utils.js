// Format list of tasks
function formatTaskList (tasks) {
    let formattedList = 'Tareas pendientes:\n\n';
    tasks.forEach((task, index) => {
      const listItem = `${index + 1}. ${task.name}`;
      formattedList += `${listItem}\n`;
    });
  
    return `*${formattedList}*`;
}

module.exports = {formatTaskList}
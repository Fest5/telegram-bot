// Format list of tasks
function formatTaskList (tasks, reminder) {
    let formattedList = 'Your pending tasks:\n\n';
    if(reminder) {
        formattedList = 'Here is your reminder!\n\n Your pending tasks:\n\n'
    }
    tasks.forEach((task, index) => {
      const listItem = `${index + 1}. ${task.name}`;
      formattedList += `${listItem}\n`;
    });
  
    return `*${formattedList}*`;
}

module.exports = {formatTaskList}
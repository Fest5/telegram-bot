const { db } = require("./firebase")

// Function to get tasks for a specific user
async function getTasks(userId, status) {
    const tasks = await db.collection('users').doc(userId).collection('tasks').get();
    let allTasks = []
    tasks.forEach((doc) => {
      if(!status) {
        allTasks.push({...doc.data(), id: doc.id})
      } else {
            if(doc.data().status === status) {
                allTasks.push({...doc.data(), id: doc.id})
            }
        }}
    );
    
    return allTasks
}
  
// Function to create a task for a specific user
async function createTask(userId, taskName) {

const userRef = db.collection('users').doc(userId);
const newTaskRef = userRef.collection('tasks').doc();

await newTaskRef.set({
    name: taskName,
    status: 'pending'
}).then(() => {
    return 'success'
}
).catch(err => {return err})
}
  
async function completeTask(userId, taskId) {
const taskRef = db.collection('users').doc(userId).collection('tasks').doc(taskId);

return taskRef.update({ status: 'completed' })
    .then(() => {
    console.log('Task marked as completed');
    })
    .catch((error) => {
    console.error('Error completing task:', error);
    throw error;
    });
}

module.exports = {getTasks, createTask, completeTask}
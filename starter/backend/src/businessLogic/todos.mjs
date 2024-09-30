import * as uuid from 'uuid'

import { TodosAccess } from '../dataLayer/todosAccess.mjs'

const todosAccess = new TodosAccess()

export async function getAllTodos(userId) {
  return todosAccess.getAllTodosByUser(userId)
}

export async function createTodo(createTodoRequest, userId) {
  const itemId = uuid.v4()

  return await todosAccess.createTodo({
    todoId: itemId,
    userId: userId,
    dueDate: createTodoRequest.dueDate,
    createdAt: new Date().toISOString(),
    name: createTodoRequest.name,
    done: false
  })
}

export async function updateTodo(updatedTodo, todoId, userId) {
  return await todosAccess.updateTodo(updatedTodo, todoId, userId)
}

export async function deleteTodo(todoId, userId) {
  return await todosAccess.deleteTodo(todoId, userId)
}

export async function todoExistsForUser(todoId, userId) {
  return await todosAccess.todoExistsForUser(todoId, userId)
}

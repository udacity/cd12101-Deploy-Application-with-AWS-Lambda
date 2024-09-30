import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import { getUserId } from '../auth/utils.mjs'
import { updateTodo, todoExistsForUser } from '../../businessLogic/todos.mjs'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('update-todo')

export const handler = middy()
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
  .handler(async (event) => {
    const todoId = event.pathParameters.todoId
    const updatedTodo = JSON.parse(event.body)

    const authorization = event.headers.Authorization
    const userId = getUserId(authorization)

    const validTodoId = await todoExistsForUser(todoId, userId)

    if (!validTodoId) {
      throw createError(
        404,
        JSON.stringify({
          error: 'Todo not found for user'
        })
      )
    }
    
    // Updates a TODO item with the provided id and using the "updatedTodo" object
    logger.info(`Received todo from user ${userId} to update`, { todo: updatedTodo })
    await updateTodo(updatedTodo, todoId, userId)

    return {
      statusCode: 200,
      body: ''
    }
  })

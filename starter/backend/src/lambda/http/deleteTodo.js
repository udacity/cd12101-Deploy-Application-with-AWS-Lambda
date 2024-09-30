import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import { getUserId } from '../auth/utils.mjs'
import { deleteTodo, todoExistsForUser } from '../../businessLogic/todos.mjs'
import createError from 'http-errors'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('delete-todo')

export const handler = middy()
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
  .handler(async (event) => {
    const todoId = event.pathParameters.todoId

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

    await deleteTodo(todoId, userId)
    logger.info(`Deleted successfully todo with id ${todoId}`)

    return {
      statusCode: 204
    }
  })

import { useAuth0 } from '@auth0/auth0-react'
import dateFormat from 'dateformat'
import React, { useState } from 'react'
import { Divider, Grid, Input } from 'semantic-ui-react'
import { createTodo } from '../api/todos-api'

export function NewTodoInput({ onNewTodo }) {
  const [newTodoName, setNewTodoName] = useState('')

  const { getAccessTokenSilently } = useAuth0()

  const onTodoCreate = async (event) => {
    try {
      const accessToken = await getAccessTokenSilently({
        scope: 'write:todos'
      })
      const dueDate = calculateDueDate()
      const createdTodo = await createTodo(accessToken, {
        name: newTodoName,
        dueDate
      })
      onNewTodo(createdTodo)
    } catch (e) {
      console.log('Failed to created a new TODO', e)
      alert('Todo creation failed')
    }
  }

  return (
    <Grid.Row>
      <Grid.Column width={16}>
        <Input
          action={{
            color: 'teal',
            labelPosition: 'left',
            icon: 'add',
            content: 'New task',
            onClick: onTodoCreate
          }}
          fluid
          actionPosition="left"
          placeholder="To change the world..."
          onChange={(event) => setNewTodoName(event.target.value)}
        />
      </Grid.Column>
      <Grid.Column width={16}>
        <Divider />
      </Grid.Column>
    </Grid.Row>
  )
}

function calculateDueDate() {
  const date = new Date()
  date.setDate(date.getDate() + 7)

  return dateFormat(date, 'yyyy-mm-dd')
}

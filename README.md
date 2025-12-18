# Serverless TODO

**For Reviewers:** This application is fully implemented and deployed. To run locally, you'll need to:
1. Set up your own AWS account and configure AWS credentials
2. Create your own Auth0 application and configure the credentials
3. Deploy the backend using the instructions below
4. Configure the frontend `.env` file with your API endpoint and Auth0 credentials

**Live Demo:** https://d31lh6t972jnhl.cloudfront.net (uses my Auth0 account - for reference only)

To implement this project you need to implement a simple TODO application using AWS Lambda and Serverless framework. Search for all the `TODO:` comments in the code to find the placeholders that you need to implement.

# Functionality of the application

This appliation will allow to create/remove/update/get TODO items. Each TODO item can optionally have an attachment image. Each user only has access to TODO items that he/she has created. 

# Functions to be implemented

To implement this project you need to implement the following functions and configure them in the `serverless.yml` file:

* `Auth` - this function should implement a custom authorizer for API Gateway that should be added to all other functions.
* `GetTodos` - should return all TODOs for a current user. 
* `CreateTodo` - should create a new TODO for a current user. A shape of data send by a client application to this function can be found in the `CreateTodoRequest.ts` file
* `UpdateTodo` - should update a TODO item created by a current user. A shape of data send by a client application to this function can be found in the `UpdateTodoRequest.ts` file
* `DeleteTodo` - should delete a TODO item created by a current user. Expects an id of a TODO item to remove.
* `GenerateUploadUrl` - returns a presigned url that can be used to upload an attachment file for a TODO item. 

All functions are already connected to appriate events from API gateway

An id of a user can be extracted from a JWT token passed by a client

You also need to add any necessary resources to the `resources` section of the `serverless.yml` file such as DynamoDB table and and S3 bucket.

# Frontend

The `client` folder contains a web application that can use the API that should be developed in the project.

To use it please edit the `config.ts` file in the `client` folder:

```ts
const apiId = '...' API Gateway id
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  domain: '...',    // Domain from Auth0
  clientId: '...',  // Client id from an Auth0 application
  callbackUrl: 'http://localhost:3000/callback'
}
```


# Suggestions

To store TODO items you might want to use a DynamoDB table with local secondary index(es). A create a local secondary index you need to a create a DynamoDB resource like this:

```yml

TodosTable:
  Type: AWS::DynamoDB::Table
  Properties:
    AttributeDefinitions:
      - AttributeName: partitionKey
        AttributeType: S
      - AttributeName: sortKey
        AttributeType: S
      - AttributeName: indexKey
        AttributeType: S
    KeySchema:
      - AttributeName: partitionKey
        KeyType: HASH
      - AttributeName: sortKey
        KeyType: RANGE
    BillingMode: PAY_PER_REQUEST
    TableName: ${self:provider.environment.TODOS_TABLE}
    LocalSecondaryIndexes:
      - IndexName: ${self:provider.environment.INDEX_NAME}
        KeySchema:
          - AttributeName: partitionKey
            KeyType: HASH
          - AttributeName: indexKey
            KeyType: RANGE
        Projection:
          ProjectionType: ALL # What attributes will be copied to an index

```

To query an index you need to use the `query()` method like:

```ts
await this.dynamoDBClient
  .query({
    TableName: 'table-name',
    IndexName: 'index-name',
    KeyConditionExpression: 'paritionKey = :paritionKey',
    ExpressionAttributeValues: {
      ':paritionKey': partitionKeyValue
    }
  })
  .promise()
```

# Prerequisites for Running Locally

Before running this application, you must have:

1. **AWS Account** with configured credentials (`aws configure`)
2. **Auth0 Account**:
   - Create a new application at https://auth0.com
   - Configure **Allowed Callback URLs**: `http://localhost:3000/callback`
   - Configure **Allowed Logout URLs**: `http://localhost:3000`
   - Configure **Allowed Web Origins**: `http://localhost:3000`
   - Note your **Domain**, **Client ID**, and set **Audience** to `https://todo-api`
3. **Node.js** 18.x or higher
4. **Serverless Framework**: `npm install -g serverless`

# How to run the application

## Backend

To deploy an application run the following commands:

```bash
cd backend
npm install

# Set Auth0 environment variables
export AUTH0_DOMAIN=your-auth0-domain.us.auth0.com
export AUTH0_AUDIENCE=https://todo-api

# Deploy to AWS
sls deploy -v
```

**Important:** Make sure to:
- Configure your AWS credentials before deploying
- Replace `your-auth0-domain.us.auth0.com` with your actual Auth0 domain
- Ensure your Auth0 application is configured with the correct callback URLs

## Frontend

To run a client application, first create a `.env` file in the `client` folder with the following content:

```bash
REACT_APP_API_ENDPOINT=https://your-api-id.execute-api.us-east-2.amazonaws.com/prod
REACT_APP_AUTH0_DOMAIN=your-auth0-domain.us.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-auth0-client-id
REACT_APP_AUTH0_AUDIENCE=https://todo-api
PORT=3000
```

Then run the following commands:

```bash
cd client
npm install
npm start
```

This should start a development server with the React application that will interact with the serverless TODO application.

**Important:** 
- Replace `your-api-id` with the API Gateway ID from your deployment
- Replace `your-auth0-domain` with your actual Auth0 domain
- Replace `your-auth0-client-id` with your Auth0 application client ID
- In Auth0, add your application URL (e.g., `http://localhost:3000` or your Codespaces URL) to the Allowed Callback URLs, Allowed Logout URLs, and Allowed Web Origins
- If using GitHub Codespaces, ensure port 3000 is set to "Public" visibility in the PORTS tab

# Testing the Application

## Testing the Frontend

To verify your frontend is working:

1. Open your application URL in a browser (e.g., `http://localhost:3000` or your Codespaces URL)
2. Click the "Log in" button to authenticate with Auth0
3. After successful login, you should be redirected back to the application
4. Try creating a new TODO item by entering a name and due date
5. The TODO should appear in the list below
6. Test updating a TODO by checking the "done" checkbox
7. Test deleting a TODO by clicking the delete button

**Expected behavior:**
- You can log in successfully
- TODOs are created, displayed, updated, and deleted
- Each user only sees their own TODOs

## Testing the API with curl

To test the API directly, you'll need a valid JWT token. To get one:

1. Log into your frontend application
2. Open browser DevTools (F12)
3. Go to the Console tab and run:
   ```javascript
   localStorage.getItem('access_token')
   ```
4. Copy the token (without quotes)

**Note:** If using a different Auth0 library, check the Network tab in DevTools and look for the `Authorization` header in API requests.

Once you have the token, test the API endpoints:

### Get All TODOs
```bash
curl -X GET "https://your-api-id.execute-api.us-east-2.amazonaws.com/prod/todos" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected response:** JSON array of TODO items
```json
[
  {
    "todoId": "123-456-789",
    "userId": "google-oauth2|...",
    "name": "Test TODO",
    "dueDate": "2025-12-31",
    "done": false,
    "createdAt": "2025-12-02T10:30:00.000Z"
  }
]
```

### Create a TODO
```bash
curl -X POST "https://your-api-id.execute-api.us-east-2.amazonaws.com/prod/todos" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Buy groceries", "dueDate": "2025-12-31"}'
```

**Expected response:** The newly created TODO item

### Update a TODO
```bash
curl -X PATCH "https://your-api-id.execute-api.us-east-2.amazonaws.com/prod/todos/TODO_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Buy groceries", "dueDate": "2025-12-31", "done": true}'
```

**Expected response:** 200 OK

### Delete a TODO
```bash
curl -X DELETE "https://your-api-id.execute-api.us-east-2.amazonaws.com/prod/todos/TODO_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected response:** 200 OK

### Generate Upload URL
```bash
curl -X POST "https://your-api-id.execute-api.us-east-2.amazonaws.com/prod/todos/TODO_ID/attachment" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected response:**
```json
{
  "uploadUrl": "https://your-bucket.s3.amazonaws.com/...presigned-url..."
}
```

Then upload an image:
```bash
curl -X PUT -T image.jpg "PRESIGNED_URL_FROM_ABOVE"
```

## Verifying AWS Resources

Check that your AWS resources were created successfully:

```bash
# List DynamoDB tables
aws dynamodb list-tables --region us-east-2

# List S3 buckets
aws s3 ls | grep serverless-todo

# List Lambda functions
aws lambda list-functions --region us-east-2 | grep serverless-todo
```

## Common Issues

- **401 Unauthorized:** Token expired or invalid - get a new token by logging in again
- **403 Forbidden:** Check Auth0 configuration and authorizer policy
- **CORS errors:** Verify CORS headers in `serverless.yml` and Gateway Responses
- **Frontend not loading:** Check that port is public in Codespaces and `.env` is configured correctly

# "curl" commands

An alternative way to test your API you can use the following curl commands. For all examples below you would need to replace:

* {API-ID} - with you API's ID that is returned by the Serverless framework
* {JWT-token} - a JWT token from the web application

## Get all TODOs

To fetch all TODOs you would need to send the following GET request:

```sh
curl --location --request GET 'https://{API-ID}.execute-api.us-east-1.amazonaws.com/dev/todos' \
--header 'Authorization: Bearer {JWT-token}'
```

## Create a new TODO

To create a new TODO you would need to send a POST request and provide a JSON with two mandatory fields: `name` and `dueDate`.

```sh
curl --location --request POST 'https://{API-ID}.execute-api.us-east-1.amazonaws.com/dev/todos' \
--header 'Authorization: Bearer {JWT-token}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "Buy bread",
    "dueDate": "2022-12-12"
}'
```

## Update a TODO

To update a TODO you would need to send a PATCH request and provide one of the following fields: `name`, `dueDate`, and boolean `done`.

You would also need to provide an ID of an existing TODO in the URL.

```sh
curl --location --request PATCH 'https://{API-ID}.execute-api.us-east-1.amazonaws.com/dev/todos/{TODO-ID}' \
--header 'Authorization: Bearer {JWT-token}' \

--header 'Content-Type: application/json' \
--data-raw '{
    "name": "Buy bread",
    "dueDate": "2022-12-12",
    "done": true
}'
```

## Remove TODO

To remove a TODO you would need to send a `DELETE` request, and provide an ID of an existing TODO, as well as other parameters.

```sh
curl --location --request DELETE 'https://{API-ID}.execute-api.us-east-1.amazonaws.com/dev/todos/{TODO-ID}' \
--header 'Authorization: Bearer {JWT-token}'
```


## Upload image attachment

To upload an image attachment you would first need to send a POST request to the following URL:

```sh
curl --location --request POST 'https://{API-ID}.execute-api.us-east-1.amazonaws.com/dev/todos/{TODO-ID}/attachment' \
--header 'Authorization: Bearer {JWT-token}'
```

It should return a response like this that would provide a pre-signed URL:

```json
{
    "uploadUrl": "https://serverless-c4-todo-images.s3.us-east-1.amazonaws.com/...&x-id=PutObject"
}
```

We can then use curl command to upload an image (`image.jpg` in this example) to S3 using this pre-signed URL:

```sh
curl -X PUT -T image.jpg -L "https://serverless-c4-todo-images.s3.us-east-1.amazonaws.com/...&x-id=PutObject"
```


const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// create table in todo

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", status, priority } = request.query;
  const priorityAndStatusCheck = (para) => {
    return para.status != undefined && para.priority != undefined;
  };
  const priorityCheck = (para) => {
    return para.priority != undefined;
  };
  const statusCheck = (para) => {
    return para.status != undefined;
  };
  switch (true) {
    case priorityAndStatusCheck(request.query):
      getTodoQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case priorityCheck(request.query):
      getTodoQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case statusCheck(request.query):
      getTodoQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodoQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodoQuery);
  response.send(data);
});

//Get a particular todo

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `
      SELECT 
         *
      FROM
        todo
      WHERE 
        id = ${todoId};`;
  const todo = await db.get(getTodo);
  response.send(todo);
});

// insert a todo

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const insertTodo = `
    INSERT INTO
      todo(id, todo, priority, status)
    VALUES(
        ${id},
        '${todo}',
        '${priority}',
        '${status}');`;
  await db.run(insertTodo);
  response.send("Todo Successfully Added");
});

// upadate todo

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const request1 = request.body;
  let updatedMessage = "";

  switch (true) {
    case request1.status != undefined:
      updatedMessage = "Status Updated";
      break;
    case request1.priority != undefined:
      updatedMessage = "Priority Updated";
      break;
    case request1.todo != undefined:
      updatedMessage = "Todo Updated";
      break;
  }
  const previousTodoQuery = `
      SELECT *
      FROM 
        todo
      WHERE 
        id = ${todoId};
    `;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    todo = previousTodo.todo,
  } = request.body;
  const queryToUpdate3 = `
        UPDATE todo
            SET 
               todo = '${todo}',
               priority = '${priority}',
               status = '${status}';
            WHERE 
               id = ${todoId};
           `;
  await db.run(queryToUpdate3);
  response.send(updatedMessage);

  console.log(previousTodo);
});

// delete todo

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
       DELETE FROM 
       todo
       WHERE 
         id = ${todoId};
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;

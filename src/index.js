const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt=require('bcrypt')
const cors=require('cors')
const mysql=require('mysql')
app.use(cors());
const jwttoken=require('jsonwebtoken')
let db = null;
let dbs = null;
app.use(express.json());
const path = require("path");
const { query } = require("express");
const filepath = path.join(__dirname, "goodreads.db");
const filepaths = path.join(__dirname, "todoApplication.db");

const connection=mysql.createConnection({
    host:'localhost',
    database:'userdata',
    user:'root',
    authentication_string:'*6615099F4DE61F75B34C89C6FA5D85AE5CE531CD',
    password:'@Mallikarjun8421'
});

connection.connect(function(err){   
    if (err){
        console.error('Error connecting'+err.stack);
        return;
    }
    console.log('connected as id'+connection.threadId)
});

//connection.query('select * from register;',function(error,results,fields){
 // if (error)
 // throw error;
 // results.forEach(result => {
   //   console.log(result)
 // });
//})
 


const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: filepath,
      driver: sqlite3.Database,
    });
    dbs = await open({
        filename: filepaths,
        driver: sqlite3.Database,
      });
    app.listen(5001, () => {
      console.log("server has starting at https://localhost:5001");
    });
  } catch (e) {
    console.log(`error ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

app.get("/userdetails/",async(request,respone)=>{
  connection.query('select * from userdata.register where username="raju";',function(error,results,fields){
    if (error)
    throw error;
   
    respone.send(results[0])
  }) 
});

app.post("/userregister/",async(request,response)=>{
  const {username,email,password}=request.body;
  console.log(request.body)
  console.log("username")
  console.log(username) 
  console.log("password")
  const encrpt=await bcrypt.hash(password,10);
  console.log(encrpt);

 connection.query('select * from userdata.register where username=?;',username,function(error,results,fields){
    if (error)
    throw error;
    console.log(results.length)
    console.log(results)
    if (results.length===0){
      console.log("ressulst")
      connection.query('INSERT INTO userdata.register SET ?',{username:username,email:email,password:encrpt},function(err,results,fields){
        if (err) 
          throw err;
          response.send('user has been updated successfully.');
    })
  } else{
    response.status(400);
    response.send("already username exits");
  }
  });
  
})

app.post("/user/",async(request,reponse)=>{
  const {username,name,password,location,gender}=request.body;
  const encrpt=await bcrpt.hash(password,10);
  console.log(encrpt);
  const query=`
  select * from user
  where name='${name}';`;
  const data=await db.get(query);
  if (data!==undefined){
    reponse.status(400);
    reponse.send("user already exits")
  }else{
   const querys=`
   insert into user(username,name,location,gender,password)
   values('${username}','${name}','${location}','${gender}','${encrpt}');`;
   await db.run(querys);
   reponse.send('user register successfully')
  }
});

const authenticatetoken=(request,response,next)=>{
  const authHeader=request.headers["authorization"]
  let token;
  if (authHeader!==undefined){
    token=authHeader.split(" ")[1]
  }
  if (token===undefined){
    response.status(400);
    response.send("invalid token")
  }else{
    const verifytoken=jwttoken.verify(token,"thissecretkey",async(err,user)=>{
      if (err){
        response.send("error occured")
      }else{
        request.username=user.username;
        next();
      }
    })
  }
}

app.get("/profile/",authenticatetoken,async(request,response)=>{
  let {username}=request;
  console.log(username)
const query=`
select * from user where username='${username}';`;
const getdata=await db.get(query);
response.send(getdata);
})

app.get("/getdata/",(request,response)=>{
  response.send("hellow rod");
})

app.get("/books/:bookId/",authenticatetoken, async (request, response) => {
  const { bookId } = request.params;
  const querytorun = `
    SELECT * FROM 
    book
   WHERE
    book_id=${bookId};`;
  const dataofbooks = await db.get(querytorun);
  response.send(dataofbooks);
});



app.get("/books/", async (request, response) => {
const {offset=0,limit=5,order='desc',orderby='book_id',search=''}=request.query;
        const querytorun = `
          SELECT * FROM 
          book
          where
          title LIKE '%${search}%'
          ORDER BY 
          ${orderby} ${order}
          limit ${limit} offset ${offset};`;
      
          const dataofbooks = await db.all(querytorun);
          response.send(dataofbooks);
  
});
 

app.get("/todos/", async (request, response) => {
    const querytorun = `
      SELECT * FROM  
      todo;`;
    const dataofbooks = await dbs.all(querytorun);
    response.send(dataofbooks);
  });
app.post("/books/", async (request, response) => {
  const bookdetails = request.body;
  const {
    title,
    authorId,
    rating,
    ratingCount,
    reviewCount,
    description,
    pages,
    dateOfPublication,
    editionLanguage,
    price,
    onlineStores,
  } = bookdetails;
  const addBookQuery = `
    INSERT INTO
      book (title,author_id,rating,rating_count,review_count,description,pages,date_of_publication,edition_language,price,online_stores)
    VALUES
      (
        '${title}',
         ${authorId},
         ${rating},
         ${ratingCount},
         ${reviewCount},
        '${description}',
         ${pages},
        '${dateOfPublication}',
        '${editionLanguage}',
         ${price},
        '${onlineStores}'
      );`;
  const dataofbooks = await db.run(addBookQuery);
  const bookdet = dataofbooks.lastID;
  response.send({ bookdet: bookdet });
});
app.put("/books/:bookid/",authenticatetoken,async(request,response)=>{
    const {bookid}=request.params;
    console.log(bookid)
    const {title}=request.body;
    const query=`
    update book
    set title='${title}'
    where book_id=${bookid};
    `;
    const updatedata=await db.run(query);
    response.send("book updated successfully");
});

app.put("/todos/:todoId/", async (request, response) => {
  const more = request.body;

  const { todoId } = request.params;
  let column = "";
  switch (true) {
    case more.status !== undefined:
      column = "Status";
      break;
    case more.priority !== undefined:
      column = "Priority";

      break;
    case more.todo !== undefined:
      column = "Todo";
      break;
  }
  const query = `
   SELECT 
     * 
   FROM 
      todo 
    WHERE 
        id = ${todoId};`;
  const firstdata = await db.get(query);
  console.log("1");
  console.log(firstdata);
  console.log(firstdata.todo);

  const {
    todo,
    status = firstdata.status,
    priority = firstdata.priority,
  } = request.body;
  console.log(todo);
  console.log("2");
  console.log(request.body);

  const querydetail = `
        UPDATE 
           todo
        SET 
          todo='${todo}',
          status='${status}',
          priority='${priority}'
        WHERE 
           id= ${todoId};`;
  const finaldetails = await db.get(querydetail);
  response.send(`${column} Updated`);
});


const priorityandstatusandcategory = (object) => {
  return (
    object.category !== undefined &&
    object.status !== undefined &&
    object.priority !== undefined
  );
};

const priorityandcategory = (object) => {
  return object.category !== undefined && object.priority !== undefined;
};

const statusandcategory = (object) => {
  return object.category !== undefined && object.status !== undefined;
};

const havingcategory = (object) => {
  return object.category !== undefined;
};
const priorityandstatus = (object) => {
  return object.status !== undefined && object.priority !== undefined;
};

const havingstatus = (object) => {
  return object.status !== undefined;
};

const havingpriority = (object) => {
  return object.priority !== undefined;
};

const makeobjectdata = (object) => {
  return {
    id: object.id,
    todo: object.todo,
    priority: object.priority,
    status: object.status,
    category: object.category,
    dueDate: object.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let querydetails = "";
  switch (true) {
    case havingstatus(request.query):
      querydetails = `
            SELECT 
             * 
           FROM
              todo
            WHERE
              todo LIKE '%${search_q}%' 
              AND status = "${status}";`;
      break;
    case havingpriority(request.query):
      querydetails = `
            SELECT 
              * 
            FROM
               todo
            WHERE
                todo LIKE "%${search_q}%"
               AND priority='${priority}';`;
      break;
    case havingstatusandpriority(request.query):
      querydetails = `
            SELECT * FROM
              todo
            WHERE
                todo LIKE "%${search_q}%"
                AND   status = "${status}"
                AND  priority = '${priority}';`;
      break;
    default:
      querydetails = `
            SELECT 
              * 
            FROM
               todo
            WHERE
              todo LIKE "%${search_q}%";`;
  }
  const content = await db.all(querydetails);
  console.log(querydetails);
  console.log("super");

  response.send(content);
});


app.get("/todos/", async (request, response) => {
  const { priority, status, search_q = "", category } = request.query;
  console.log(category);
  let todolist;

  switch (true) {
    case priorityandstatusandcategory(request.query):
      if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (
        category !== "WORK" &&
        category !== "HOME" &&
        category !== "LEARNING"
      ) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (
        priority !== "HIGH" &&
        priority !== "MEDIUM" &&
        priority !== "LOW"
      ) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        todolist = `
    SELECT 
    * 
    FROM
    todo
    WHERE
    todo LIKE '%${search_q}%' AND priority='${priority}' AND category='${category}' AND status='${status}';`;
      }

      break;
    case priorityandcategory(request.query):
      if (
        category !== "WORK" &&
        category !== "HOME" &&
        category !== "LEARNING"
      ) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (
        priority !== "HIGH" &&
        priority !== "MEDIUM" &&
        priority !== "LOW"
      ) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        todolist = `
    SELECT 
    * 
    FROM
    todo
    WHERE
    todo LIKE '%${search_q}%' AND priority='${priority}' AND category='${category}';`;
      }

      break;
    case priorityandstatus(request.query):
      if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (
        priority !== "HIGH" &&
        priority !== "MEDIUM" &&
        priority !== "LOW"
      ) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        todolist = `
    SELECT 
    * 
    FROM
    todo
    WHERE
    todo LIKE '%${search_q}%' AND priority='${priority}'  AND status='${status}';`;
      }

      break;

    case statusandcategory(request.query):
      if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (
        category !== "WORK" &&
        category !== "HOME" &&
        category !== "LEARNING"
      ) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        todolist = `
    SELECT 
    * 
    FROM
    todo
    WHERE
    todo LIKE '%${search_q}%'  AND category='${category}' AND status='${status}';`;
      }

      break;
    case havingstatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        todolist = `
    SELECT 
    * 
    FROM
    todo
    WHERE
    todo LIKE '%${search_q}%'  AND  status='${status}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case havingpriority(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        todolist = `
    SELECT 
    * 
    FROM
    todo
    WHERE
    todo LIKE '%${search_q}%' AND priority='${priority}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case havingcategory(request.query):
      console.log(category);
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        todolist = `
    SELECT 
    * 
    FROM
    todo
    WHERE
    todo LIKE '%${search_q}%' AND  category='${category}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      todolist = `
    SELECT 
    * 
    FROM
    todo
    WHERE
    todo LIKE '%${search_q}%';`;
      break;
  }
  if (todolist !== undefined) {
    const getalltodos = await db.all(todolist);
    console.log(getalltodos);
    response.send(getalltodos.map((object) => makeobjectdata(object)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getdetails = `
  SELECT * FROM 
  todo
  WHERE 
  id=${todoId};`;

  const item = await db.get(getdetails);
  const demo = {
    id: item.id,
    todo: item.todo,
    priority: item.priority,
    status: item.status,
    category: item.category,
    dueDate: item.due_date,
  };
  response.send(demo);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (
    date === undefined ||
    date !==
      format(
        new Date(
          getYear(new Date(date)),
          getMonth(new Date(date)),
          getDate(new Date(date))
        ),
        "yyyy-MM-dd"
      )
  ) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const getdetails = `
            SELECT * FROM 
            todo
            WHERE 
            due_date='${date}';`;
    const gettodoiditem = await db.all(getdetails);
    response.send(gettodoiditem);
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, category, status, dueDate } = request.body;

  if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    dueDate === undefined ||
    dueDate !==
      format(
        new Date(
          getYear(new Date(dueDate)),
          getMonth(new Date(dueDate)),
          getDate(new Date(dueDate))
        ),
        "yyyy-MM-dd"
      )
  ) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const getdetails = `
    INSERT INTO 
    todo (id,todo,priority,status,category,due_date)
    VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
    const updatedata = await db.run(getdetails);
    response.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const fulldata = request.body;

  let temp;
  const { todoId } = request.params;

  switch (true) {
    case fulldata.status !== undefined:
      temp = "Status";
      break;
    case fulldata.category !== undefined:
      temp = "Category";
      break;
    case fulldata.todo !== undefined:
      temp = "Todo";
      break;
    case fulldata.priority !== undefined:
      temp = "Priority";
      break;
    case fulldata.dueDate !== undefined:
      temp = "Due Date";
      break;
  }

  const todoiddetails = `
    SELECT * FROM
    todo
    WHERE
    id=${todoId};`;
  const totaldetails = await db.get(todoiddetails);
  const {
    todo = totaldetails.todo,
    priority = totaldetails.priority,
    category = totaldetails.category,
    status = totaldetails.status,
    dueDate = totaldetails.dueDate,
  } = request.body;
  console.log(priority);

  if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    dueDate === undefined ||
    dueDate !==
      format(
        new Date(
          getYear(new Date(dueDate)),
          getMonth(new Date(dueDate)),
          getDate(new Date(dueDate))
        ),
        "yyyy-MM-dd"
      )
  ) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const getdetails = `
    UPDATE 
    todo
    SET
    todo='${todo}',
    status='${status}',
    priority='${priority}',
    category='${category}',
    due_date='${dueDate}';
    `;
    const totalupdate = await db.run(getdetails);
    console.log("wow");
    console.log(totalupdate);
    response.send(`${temp} Updated`);
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const removedetails = `
  DELETE FROM
todo
WHERE
id=${todoId};`;
  const updatedetails = await db.run(removedetails);
  response.send("Todo Deleted");
});





app.post("/login/",async(request,reponse)=>{
  const {username,password}=request.body;
  const encrpt=await bcrpt.hash(password,10);
  console.log(encrpt);
  const query=`
  select * from user
  where username='${username}';`;
  const data=await db.get(query);
  if (data===undefined){
    reponse.status(400);
    reponse.send("user already exits")
  }else{
   const compare=await bcrpt.compare(password,data.password);
   if (compare){
    const token=jwttoken.sign({username},"thissecretkey");
    reponse.send({token});
   }else{
    reponse.send("please enter correct password");
  }
   
  }
})

app.delete("/books/:bookid/",async(request,response)=>{
    const {bookid}=request.params
    const query=`
    delete from book
    where book_id=${bookid};`;
    const deletelement=await db.run(query);
    response.send("book deleted")
});


app.get("/author/:authorid/books/:bookid/",async(request,respone)=>{
const {authorid,bookid}=request.params
const query=`select * from book
where author_id=${authorid} and book_id=${bookid};`;
const getdata=await db.all(query);
respone.send(getdata);
})
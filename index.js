// TO DO
// add column author in db where i store what i get from API 
// get author by api idea: in /new, when i type the title, it gives me suggestions, when i click on one, it gives me the author, isbn/id and cover

// only show title in the path /book/title without %20 for empty space?

// autocomplete off

////// where to add notes, how to edit them, allow updates only on one inputs
//////idea 1: next to edit and delete, button add notes, which takes me to notes.ejs which has a form like the one in permalist, where i can also edit them
//////idea 2: on /new, same as idea 1, likewise on /edit

// in /update only date read, rating and summary can be edited

// for when i edit a book, if i edited a field, the value is the new edited value, if not is stays the same (if else)

// filter by (title, date, rating) and sort by (asc, desc)

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import env from "dotenv";
const app = express();
const port = 3000;

env.config();

const API_URL = "https://openlibrary.org/search.json?q=";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
});

db.connect(); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



//get records from database to display on home page
app.get("/", async (req, res) => {
  try {
      const result = await db.query("SELECT * FROM book JOIN book_info ON book.id = book_info.id");  
      //console.log(result.rows);
      res.render("index.ejs", { books: result.rows});
  } catch (err) {
      console.log(err);
  }

});

//render new.ejs which contains the form to add new book, when i click NEW BUTTON on home page
app.post("/new", async(req,res)=>{
  if(req.body.new === "new"){
    res.render("new.ejs");
  }
  else res.redirect("/");
})

//get values from inputs when adding a new book and insert them into database returning the PK book.id
app.post("/add", async (req,res) =>{

  const book_title = req.body.title;
  const book_isbn = req.body.isbn;
  const book_info_date_read = req.body.date_read;
  const book_info_rating = req.body.rating;
  const book_info_summary = req.body.summary;
  //const book_notes = req.body.notes;


  //insert in db and getting the id of the book just added, so that i can insert into book_info (PK -> FK)
  try{
    const result = await db.query("INSERT INTO book (title, isbn) VALUES ($1, $2) RETURNING *",
      [book_title, book_isbn]
    );

    //the id of the book i've just added
    const current_id = result.rows[0].id;

    await db.query("INSERT INTO book_info (id, date_read, rating, summary) VALUES ($1, $2, $3, $4)",
      [current_id, book_info_date_read, book_info_rating, book_info_summary]
    );
    // await db.query("INSERT INTO note (book_id, notes) VALUES ($1, $2)",
    //   [current_id, book_notes]
    // );

    //after completion, redirect to home page and viewing all the books
    res.redirect("/");
  } catch (err){
    console.log(err);
  }
});


// when i click Edit button under one of the books on home page, it takes me to edit.ejs, that contains a form with the existing data of that specific book
app.post("/edit/:id", async (req,res) =>{
  const input = req.params['id'];

  //  JOIN note ON note.book_id = book.id ---- for when i figure out the notes part
  const result = await db.query("SELECT * FROM book JOIN book_info ON ( book.id = book_info.id AND book.id = ($1))",
    [input]
  );
  res.render("edit.ejs", {
    existingBook: result.rows[0],
    notes: result.rows.map((n) => n.notes )
  });
});

//update record in db
app.post("/update/:id", async(req,res) => {
  const input = req.params.id;

  const input_title = req.body.title;
  const input_isbn = req.body.isbn;
  const book_info_date_read = req.body.date_read;
  const book_info_rating = req.body.rating;
  const book_info_summary = req.body.summary;
  try { 
    await db.query("UPDATE book SET title = ($1) , isbn = ($2) WHERE book.id = ($3)",
    [input_title, input_isbn, input]
    );
    await db.query("UPDATE book_info SET date_read = ($1) , rating = ($2), summary = ($3) WHERE book_info.id = ($4)",
      [book_info_date_read, book_info_rating, book_info_summary, input]
    );
    
  res.redirect("/");
  } catch(err){
    console.log(err);
  }
});

//when clicking on a certain book, it takes me to a page with all the info on that book
app.get("/book/:title", async(req,res) => {
  const input_title = req.params.title;
  try{
    const foundId = await db.query("SELECT * FROM book WHERE book.title = ($1)",
      [input_title] 
    );
    //get the id of the book from the db so that i can retrieve book_info
    const input = foundId.rows[0].id;
    // JOIN note ON note.book_id = book.id --- for when i figure out the notes part
    const result = await db.query("SELECT * FROM book JOIN book_info ON ( book.id = book_info.id AND book.id = ($1)) ",
      [input] 
    );

    res.render("book.ejs",{
      books: result.rows[0],
      //notes: result.rows.map((n) => n.notes )
    //for book.ejs when i figure out the notes part
    //   <% notes.forEach(element =>{ %>
    //     <% <p><%=element%></p> %>
    //  <% }) %>
    });
  } catch (err){
    console.log(err);
  }
});

//delete a book from db, when clicking on DELETE button under each one of the books on home page
app.post("/delete/:id", async(req,res) => {
  const input = req.params.id;
  console.log(input);
  try {
    await db.query("DELETE FROM book USING book_info WHERE ( book.id = book_info.id AND book.id = ($1))",
      [input]
    );
    res.redirect("/");
  } catch(err){
    console.log(err);
  }

});


// sort
app.get("/sort/title", async(req,res)=>{
  try {
    const result = await db.query("SELECT * FROM book JOIN book_info ON book.id = book_info.id ORDER BY book.title");  
    //console.log(result.rows);
    res.render("index.ejs", { books: result.rows});
} catch (err) {
    console.log(err);
}
});

app.get("/sort/rating", async(req,res)=>{
  try {
    const result = await db.query("SELECT * FROM book JOIN book_info ON book.id = book_info.id ORDER BY book_info.rating DESC");  
    //console.log(result.rows);
    res.render("index.ejs", { books: result.rows});
} catch (err) {
    console.log(err);
}
});

app.get("/sort/date", async(req,res)=>{
  try {
    const result = await db.query("SELECT * FROM book JOIN book_info ON book.id = book_info.id ORDER BY book_info.date_read DESC");  
    //console.log(result.rows);
    res.render("index.ejs", { books: result.rows});
} catch (err) {
    console.log(err);
}
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
  





/*
<div class="a-book">
        <!-- takes me to a new page where I see all the info PLUS NOTES -->
        <a href="/book/<%=element.title%>"><%=element.title%></a>
        <!-- <small>ISBN: <%=element.isbn%></small><br> -->
        <!-- <small>Date read: <%=element.date_read.toLocaleDateString("ro-RO")%></small><br> -->
        <!-- <small>Rating <%=element.rating%>/5</small><br> -->
        <img src="https://covers.openlibrary.org/b/isbn/<%=element.isbn%>-M.jpg?default=false" alt="book cover">
        <p class="book_summary"><%=element.summary %></p>

*/
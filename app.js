const { render } = require('ejs');
const express  = require('express'); // Express web server framework
const https = require('https'); // HTTPS module
const date = require(__dirname + "/date.js");
const app = express(); // Create a new Express application
const _=require('lodash');
const dotenv = require('dotenv').config();
// const request = require('request'); // "Request" library
// const mailchimp = require('@mailchimp/mailchimp_marketing'); // Mailchimp API
app.use(express.urlencoded({ extended: true }));  //this is the body parser
app.use(express.json()); //this is the body parser
 
app.set('view engine', 'ejs'); // Set the template engine
//public variables.
//delete arrays to use mongodb and mongoose 
// const items =[ "Buy food", "Clean the house", "Take out the trash"];
// const workItems =[];
//THIS IS WHERE I START WITH MONGOOSE AND MONGO DB
 const mongoose = require('mongoose');
  //try to connect to mongoose
  //mongoose.connect('mongodb://localhost:27017/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true});
  mongoose.connect('mongodb+srv://Tullydev:'+ process.env.MONGO_Atlas_PW +'@cluster0.2nb24.mongodb.net/todolistDB?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});
  
  //create a schema
  const taskSchema= new mongoose.Schema({
    name:{ type:String}
  });
  //create a model
  const Task = mongoose.model('Task', taskSchema);

  //create three new documents ( a new item from the document model)
  const taskOne = new Task({
    name: "Buy food"
  });
  const taskTwo = new Task({
    name: "Clean the house"
  });
  const taskThree = new Task({
    name: "Take out the trash"
  });
  // place them into an array
 const defualtTasks = [taskOne, taskTwo, taskThree];
//create a schema that is for the creation of the seprate pages useing express 
  const listSchema= new mongoose.Schema({
    name:{ type:String, default: 'Work List'},
    tasks: [taskSchema]
  });
  //create a model
  const List = mongoose.model('List', listSchema);

  app.use(express.static('public')); //static files in public folder


 app.get("/",function(req,res){
   let day= date();
   Task.find({}, function(err, foundTasks){
    if(foundTasks.length=== 0){
        //save them into the database
      Task.insertMany(defualtTasks, function(err){
        if(err){
           console.log(err);
          }else{
            console.log("Successfully saved to database");            
          }});//end of insertMany
          res.redirect("/");
        }else{
          res.render("list", {listTitle: day, newListItems: foundTasks});
        }
      });//first TASK.FIND 
  });//End of app.get

  app.get("/:customListName", function(req,res){
    const customListName= _.capitalize(req.params.customListName);
    List.findOne({name:customListName}, function(err, foundTasks){
      if(!err){
        if(!foundTasks){
        const list = new List({
          name: customListName,
          tasks: defualtTasks
        });
        list.save();
        res.redirect("/"+customListName);        
      }else
      {
        res.render("list", {listTitle: foundTasks.name, newListItems: foundTasks.tasks});
      }
    }
      });
    });

  app.post("/",function(req,res){
        const taskName= req.body.newItem;
        const listName= req.body.list;
        let day= date();
        // console.log(listName);

        const newTask = new Task({  
          name: taskName
        });

        if(listName === day){
         newTask.save(); 
         res.redirect("/");    
        }else{
          List.findOne({name: listName}, function(err, foundList){
            foundList.tasks.push(newTask);
            foundList.save();
            res.redirect("/"+listName);
          });
        }
      });

app.post("/delete",function(req,res){
   const listName= req.body.listName;
  const tobeDelete= req.body.deleteTask;
  let day= date();
  // console.log(tobeDelete);
  if(listName === day){
  Task.findByIdAndRemove(tobeDelete, function(err){
    if(err){
      console.log(err);
    }else{
      console.log("Successfully deleted");
    }
  });
  res.redirect("/");
}else{
  // google search for (mongoose find and delete a doucment) than googled the answer found in stack over flow (mongoose $pull.)
  List.findOneAndUpdate({name: listName}, {$pull:{tasks:{_id: tobeDelete}}}, function(err, foundList){
    if(!err){
      res.redirect("/"+listName);
    }
  });
}
});

// app.post("/work",function(req,res){
//     var item = req.body.newitem;
//     workItems.push(item);
//     res.redirect("/work");
// });

// // app.get("/work", function(req,res){
 
// //     res.render("list",{listTitle: "Work", newListItem: workItems});
// //  });
//  app.get("/about",function(req,res){
//      res.render("about");
//     });
 app.listen(process.env.PORT || 3000,function(){
    console.log("Server started on port 3000");
});



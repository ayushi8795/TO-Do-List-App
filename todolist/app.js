const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();
const app = express();

app.set("view engine", "ejs");

app.use(bodyparser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.xctus.mongodb.net/ToDoListDB", {
  useNewUrlParser: true,
  useFindAndModify: false
});

//item schema
const itemsSchema = new mongoose.Schema({
  name: String
});

//item model
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to list"
});

const item2 = new Item({
  name: "Welcome welcome"
});

const item3 = new Item({
  name: "This is list"
});

const defaultItems = [item1, item2, item3]

// List schema such as work home etc.
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  // let today = new Date();
  // // https://stackoverflow.com/questions/3552461/how-to-format-a-javascript-date
  // let options = {
  //   weekday: "short",
  //   day: "numeric",
  //   month: "short",
  //   year: "numeric"
  // };
  // let day = today.toLocaleDateString("en-us", options);
  Item.find({}, function(err, founditems) {
    if (founditems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log("there is error");
        } else {
          console.log("Items added");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listtitle: "Today",
        newlistitems: founditems
      }); // look for ejs fileS in views
    }
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show list
        res.render("list", {
          listtitle: foundList.name,
          newlistitems: foundList.items
        });
      }
    }
  });
});

app.post("/", function(req, res) {
  let newitemadded = req.body.newitem;
  const listName = req.body.List;
  const item = new Item({
    name: newitemadded
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Item removed");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

let port = process.env.PORT; //from heroku
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on 3000");
});

'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var btoa = require('btoa');
var atob = require('atob');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI, {useNewUrlParser: true});
mongoose.connection.once('open', function(){
      console.log('Conection has been made!');
    }).on('error', function(error){
        console.log('Error is: ', error);
    });

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: 'false'}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

var urlSchema = new mongoose.Schema({
  url: String,
  hash: String
});

//urlSchema.pre("save", function(next){
//  console.log("running presave");
//})

var Url = mongoose.model('Url', urlSchema);

var isUrlValid = function(str){
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}

app.post("/api/shorturl/new", function(req, res){
  console.log(req.body.url);
  var urlData = req.body.url;
  if (!isUrlValid(urlData)) {
    console.log("invalid url")
    res.json({"error": "Invalid URL"})
  };
  Url.findOne({url: urlData}, function (err, doc) {
    if (doc) {
      console.log("url found in db");
      res.json({"original_url": doc.url, "short_url": doc.hash});
    } else {
      console.log("url not found, saving a new url");
      var newUrl = new Url({
        url: urlData,
        hash: btoa(urlData)
      });
      newUrl.save(function(err){
        if (err) return console.error(err);
        res.json({"original_url": newUrl.url, "short_url": newUrl.hash});
      });
    };
  })
})

app.get("/api/shorturl/:hash", function(req, res) {
  Url.findOne({hash: req.params.hash}, function(err, doc) {
    if (doc) {
      console.log("hash found in db, redirecting");
      res.redirect(doc.url)
    } else {
      res.json({"error": "Invalid hash"});
    }
  });
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});
var express = require('express')
var request = require("request")
var bodyParser = require('body-parser')
var async = require('async')

var router = express.Router();
var esindex = "cnddu";
var estype_user = "user";
var estype_post = "post";
var estype_booklist = "booklist";
var estype_tag = "tag";

router.route('/doc')
  .get(function(req, res) {
      let q = req.query.q;
      let author = req.query.author;
      let doc = req.query.doc;
      console.log("keyword: " + q+" | author: "+author+" | doc: "+doc);

      let requrl = "http://127.0.0.1:9200/"+author+"/"+doc+"/_search";
      console.log('req url: '+requrl);
      let options = {
          uri: requrl,
          method: 'POST',
          json: {
                    //"_source": false,
                    "query" : {
                        "bool":{
                            "must":[{"match" : { "content" : q }}]
                        }
                    },
                    "highlight" : {
                        "fields" : {
                            "content" : {}
                        }
                    }
                }
          };
      request(options, function(error, response, body) {
          console.log(body);
          res.send({'success':0,'result':body});
      });
})

router.route('/site')
  .get(function(req, res) {
      let q = req.query.q;
      let table = req.query.table;
      console.log("keyword:" + q);
      console.log("table:" + table);
      
      async.parallel([ 
          function(callback) {
              let requrl = "http://127.0.0.1:9200/"+esindex+"/"+estype_user+"/_search";
              let options = {
                  uri: requrl,
                  method: 'POST',
                  json: {
                      "query" : {
                          "match" : { "username" : q }
                      }
                  }
              };
              request(options, function(error, response, body) {
                  console.log(body);
                  try {
                      //jsonStr = JSON.stringify(body);
                      //res.send({'success': 0, 'result':body});
                      callback(null,{'success': 0, 'user':body.hits});
                  } catch (err) {
                      console.log("site query err: "+err);
                      callback(null,{'success': 1, 'user':{}});
                  }
              });
          },function(callback) {
              let requrl = "http://127.0.0.1:9200/"+esindex+"/"+estype_post+"/_search";
              let options = {
                  uri: requrl,
                  method: 'POST',
                  json: {
                      "query" : {
                          "match" : { "title" : q }
                      }
                  }
              };
              request(options, function(error, response, body) {
                  console.log(body);
                  try {
                      callback(null,{'success': 0, 'post':body.hits});
                  } catch (err) {
                      console.log("site query err: "+err);
                      callback(null,{'success': 1, 'post':{}});
                  }
              });
          },function(callback) {
              let requrl = "http://127.0.0.1:9200/"+esindex+"/"+estype_booklist+"/_search";
              let options = {
                  uri: requrl,
                  method: 'POST',
                  json: {
                      "query" : {
                          "match" : { "title" : q }
                      }
                  }
              };
              request(options, function(error, response, body) {
                  console.log(body);
                  try {
                      callback(null,{'success': 0, 'booklist':body.hits});
                  } catch (err) {
                      console.log("site query err: "+err);
                      callback(null,{'success': 1, 'booklist':{}});
                  }
              });
          },function(callback) {
              let requrl = "http://127.0.0.1:9200/"+esindex+"/"+estype_tag+"/_search";
              let options = {
                  uri: requrl,
                  method: 'POST',
                  json: {
                      "query" : {
                          "match" : { "name" : q }
                      }
                  }
              };
              request(options, function(error, response, body) {
                  console.log(body);
                  try {
                      callback(null,{'success': 0, 'tag':body.hits});
                  } catch (err) {
                      console.log("site query err: "+err);
                      callback(null,{'success': 1, 'tag':{}});
                  }
              });

          }], function done(err, results) {
              if (err) {
                  throw err;
              }
              let resp = {"success":0,"user":{},"post":{},"booklist":{},"tag":{}};
              //res.send('async result: '+JSON.stringify(results));
              for (var i = 0; i<results.length; i++) {
                  if ((results[i].post != null)&&((table == undefined)||(table == "post"))) {
                      resp.post = results[i].post;
                  }
                  if ((results[i].user != null)&&((table == undefined)||(table == "user"))) {
                      resp.user = results[i].user;
                  }
                  if ((results[i].booklist != null)&&((table == undefined)||(table == "booklist"))) {
                      resp.booklist = results[i].booklist;
                  }
                  if ((results[i].tag != null)&&((table == undefined)||(table == "tag"))) {
                      resp.tag = results[i].tag;
                  }

              }
              res.send(resp);
          }
      );
  });

module.exports = router;

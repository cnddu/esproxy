var express = require('express')
var request = require("request")
var bodyParser = require('body-parser')
var async = require('async')

var router = express.Router();
var esindex = "cnddu";
var estype_user = "user";
var estype_post = "post";

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
      console.log("keyword:" + q);
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
              
          }], function done(err, results) {
              if (err) {
                  throw err;
              }
              let resp = {"success":0,"user":{},"post":{}};
              //res.send('async result: '+JSON.stringify(results));
              for (var i = 0; i<results.length; i++) {
                  if (results[i].post != null) {
                      resp.post = results[i].post;
                  }
                  if (results[i].user != null) {
                      resp.user = results[i].user;
                  }
              }
              res.send(resp);
          }
      );
  });

module.exports = router;

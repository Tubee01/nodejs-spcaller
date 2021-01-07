const express = require('express');
const bodyParser = require('body-parser');
const convert = require('xml-js');
require('dotenv').config();
const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));

app.post('/', function(req, res) {
  var sql = require("mssql");

  // config for your database
  var config = {
    user: process.env.SQL_LOGIN,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_HOST,
    database: req.body['dbName'],
  };

  // connect to your database
  sql.connect(config, function(err) {

    if (err) console.log(err);

    // create Request object
    var request = new sql.Request();

    if (req.body.hasOwnProperty('params')) {
      for (const [key, value] of Object.entries(req.body['params'])) {
        request.input(key, isNaN(value) || value === '' ? (value === 'false' || value === 'true' ? sql.Bit : (Date.parse(value) !== NaN  && value !== '' ? sql.SmallDateTime :  sql.VarChar )): sql.Int, value);
      }
      console.log(request)
      request.execute(req.body['SP'], function(err1, recordsets, returnValue) {
        // ... error checks
        if (err1) {
          console.log(err1)
        return res.send(err1);
        }
        var json = [];
        let y = 0;
        if (req.body.hasOwnProperty('DS')) {
          const arrayOfObj = Object.values(recordsets['recordsets'][0]);
          arrayOfObj.forEach(function(entry) {
            json[req.body['DS'] + y] = entry;
            ++y;
          })
        }else if(recordsets['recordsets'].length >0){
          json = recordsets['recordsets'][0]
        }else{
            return res.send('Empty');
        }
        var options = {
          compact: true,
          ignoreComment: true,
          spaces: 4
        };
        var result;
        if (req.body.hasOwnProperty('xml') && req.body['xml'] ==='true') {
          result = convert.json2xml(json, options);
        }else{
          result = json;
        }

        res.send(result);

      });
    } else {
      res.send('Balhere');
    }
  });
});

var server = app.listen(5000, function() {
  console.log('Server is running..');
});

#! /usr/bin/env node
const program = require( 'commander' );
const fs = require('fs');
const axios = require('axios');
const _ = require('lodash');
const util = require( "util" );
const regex = /.*\"CrumbStore\":\{\"crumb\":\"([a-zA-Z0-9]+)\"\}/;
const LineByLineReader = require('line-by-line');
const path = __dirname +'/trading-tools-yahoo/assets/';
const setCookie = require('set-cookie-parser');
const yahooHistory = "https://finance.yahoo.com/quote/%s/history";
const yahooDownload = "https://query1.finance.yahoo.com/v7/finance/download/%s?period1=898639200&period2=1514588400&interval=1wk&events=history&crumb=";

// ================= parse program arguments

program.version( '0.0.1' )
    .option( '-l --list_groups', 'list asset groups for yahoo.com' )
    .option( '-c --list_group_composition <group>', 'list asset group composition.' )
    .option( '-g --get_group_data <group>', 'get group data' )
    .parse( process.argv );


if(program.get_group_data){
  fs.readdir(path, function(err, items) {
      for (var i=0; i<items.length; i++) {
        if((""+(i+1))===program.get_group_data
          ||program.get_group_data===items[i]){
          let filename =  path+items[i];
          let lr = new LineByLineReader(filename);
          lr.on('error', function (err) {
            console.log("Error:",err);
          });
          lr.on('line', function (line) {
            if(!line) return;
            lr.pause();
            let symbol = line.split(';')[0];
            getSymbol(symbol).then(function(data){
              console.log(symbol);
              lr.resume();
            });
          });
          lr.on('end', function () {
          });

        }

      }
  });
}
var crumb;
var cookie;

function getSymbol(symbol){
  let daxUrl = util.format( yahooHistory,symbol );
  return axios.get(daxUrl)
  .then(function (response) {
      let body = response.data;
      var cookies = setCookie.parse(response);
      cookie = cookie|| _.find(cookies,{name:'B'});
      let lines = body.match(/[^\r\n]+/g);
      _.each(lines,function(line){
          let position = line.indexOf('CrumbStore');
          if(position!==-1){
              let candidate = line.substring(position-1,position+200);
              var match = regex.exec(candidate);
              if(match && match.length ){
                  crumb = crumb || match[1] ;
              }
          }
      });
      let downloadUrl = util.format( yahooDownload,symbol );
      return axios.get(downloadUrl+crumb, {
        headers: { Cookie: "B="+cookie.value }
      }).then(function(data){
        return data.data;
      }).catch(function (error) {
        console.log(error);
      });
  })
  .catch(function (error) {
    console.log(error);
  });
}

if(program.list_groups){
  fs.readdir(path, function(err, items) {
      for (var i=0; i<items.length; i++) {
          console.log((i+1)+".",items[i]);
      }
  });
}

if(program.list_group_composition){
  fs.readdir(path, function(err, items) {
      for (var i=0; i<items.length; i++) {
        if((""+(i+1))===program.list_group_composition
          ||program.list_group_composition===items[i]){
          let filename =  path+items[i];
          let lr = new LineByLineReader(filename);
          lr.on('error', function (err) {
            console.log("Error:",err);
          });

          lr.on('line', function (line) {
            if(!line) return;
            let symbol = line.split(';')[0];
            console.log(util.format( yahooHistory,symbol ))
          });

          lr.on('end', function () {
            console.log("Finished");
          });
          /*
          console.log((i+1)+".",filename);
          fs.readFile(filename, 'utf8', function(err, data) {
              if (err) throw err;
              console.log(data);
              let lines = data.split('/\n\r?\n/');
              console.log("lines",lines);
              _.each(lines, function(line){
                let symbol = line ;
                console.log("YMBOL:",symbol);
                console.log(util.format( yahooHistory,symbol ));
              });
          });
          */
        };

      }
  });
}

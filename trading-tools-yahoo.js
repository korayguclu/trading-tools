#! /usr/bin/env node
const program = require( 'commander' );
const fs = require('fs');
const axios = require('axios');
const setCookie = require('set-cookie-parser');
const _ = require('lodash');
const util = require( "util" );
const LineByLineReader = require('line-by-line');
const moment = require('moment');

const regex = /.*\"CrumbStore\":\{\"crumb\":\"([a-zA-Z0-9]+)\"\}/;
const path = __dirname +'/trading-tools-yahoo/assets/';
const yahooHistory = "https://finance.yahoo.com/quote/%s/history";
const yahooDownload = "https://query1.finance.yahoo.com/v7/finance/download/%s?period1=%s&period2=%s&interval=1wk&events=history&crumb=%s";

// ================= parse program arguments

program.version( '0.0.1' )
    .option( '-l --list_groups', 'list asset groups for yahoo.com' )
    .option( '-c --list_group_composition <group>', 'list asset group composition.' )
    .option( '-g --get_group_data <group>', 'get group data' )
    .parse( process.argv );


if(program.get_group_data){
  let end = moment().unix();
  let start = moment().subtract( 12,'month').unix();

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
            getSymbol(symbol,start,end).then(function(data){
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

function getSymbol(symbol,start,end){

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
      return getSymbolData(symbol,start,end);
  })
  .catch(function (error) {
    console.log(error);
  });
}

function getSymbolData(symbol,start,end){
  let downloadUrl = util.format( yahooDownload,symbol,start,end,crumb );
  return axios.get(downloadUrl , {
    headers: { Cookie: "B="+cookie.value }
  }).then(function(data){
    return data.data;
  }).catch(function (error) {
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

          console.log("=========================== Started == ");
          console.log(filename);
          console.log("-------------------------------------- ");

          lr.on('error', function (err) {
            console.log("Error:",err);
          });

          lr.on('line', function (line) {
            if(!line) return;
            console.log(line)
          });

          lr.on('end', function () {
            console.log("=========================== Finished == ");
          });
         };

      }
  });
}

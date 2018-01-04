#! /usr/bin/env node
var program = require( 'commander' );
var fs = require('fs');
const path = __dirname +'/trading-tools-yahoo/assets/';

// ================= parse program arguments

program.version( '0.0.1' )
    .option( '-l --list_groups', 'list asset groups for yahoo.com' )
    .option( '-c --list_group_composition <group>', 'list asset group composition.' )
    .option( '-g --get_group_data', 'get group data' )
    .parse( process.argv );

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
          console.log((i+1)+".",filename);
          fs.readFile(filename, 'utf8', function(err, data) {
              if (err) throw err;
              console.log(data);
          });
        };

      }
  });
}

var program = require( 'commander' );

program
    .version( '0.0.1' )
    .command( 'yahoo', 'historical yahoo.com data command' ).alias( 'y' )
    .command( 'investing', 'historical investing.com data command' ).alias( 'i' )
    .parse( process.argv );

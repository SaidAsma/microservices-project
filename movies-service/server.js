const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mysql = require('mysql');

const packageDefinition = protoLoader.loadSync('./protos/movies.proto');
const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const moviePackage = grpcObject.movies;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'microservice'
});

const server = new grpc.Server();

server.addService(moviePackage.MovieService.service, {
  GetMovies: (_, callback) => {
    connection.query('SELECT * FROM movies', (error, results) => {
      if (error) {
        console.error('Error retrieving movies from database:', error);
        callback({
          code: grpc.status.INTERNAL,
          details: 'Error retrieving movies from database'
        });
        return;
      }
      callback(null, { movies: results });
    });
  },
  GetMovieById: (call, callback) => {
    const id = call.request.id;
    connection.query('SELECT * FROM movies WHERE id = ?', [id], (error, results) => {
      if (error) {
        console.error('Error retrieving movie from database:', error);
        callback({
          code: grpc.status.INTERNAL,
          details: 'Error retrieving movie from database'
        });
        return;
      }
      if (results.length === 0) {
        callback({
          code: grpc.status.NOT_FOUND,
          details: 'Movie not found'
        });
        return;
      }
      callback(null, results[0]);
    });
  },
  AddMovie: (call, callback) => {
    const { title, genre, year } = call.request;
    connection.query('INSERT INTO movies (title, genre, year) VALUES (?, ?, ?)', [title, genre, year], (error, results) => {
      if (error) {
        console.error('Error adding movie to database:', error);
        callback({
          code: grpc.status.INTERNAL,
          details: 'Error adding movie to database'
        });
        return;
      }
      const id = results.insertId;
      const movie = { id, title, genre, year };
      callback(null, movie);
    });
  },
  DeleteMovie: (call, callback) => {
    const id = call.request.id;
    connection.query('DELETE FROM movies WHERE id = ?', [id], (error, results) => {
      if (error || results.affectedRows === 0) {
        console.error('Error deleting movie from database:', error);
        callback({
          code: grpc.status.NOT_FOUND,
          details: 'Movie not found'
        });
        return;
      }
      callback(null, { success: true });
    });
  },
  UpdateMovie: (call, callback) => {
    const { id, title, genre, year } = call.request;
    connection.query('UPDATE movies SET title = ?, genre = ?, year = ? WHERE id = ?', [title, genre, year, id], (error, results) => {
      if (error || results.affectedRows === 0) {
        console.error('Error updating movie in database:', error);
        callback({
          code: grpc.status.NOT_FOUND,
          details: 'Movie not found'
        });
        return;
      }
      callback(null, { id, title, genre, year });
    });
  }
});

server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error(`Failed to bind server. Error: ${err}`);
    return;
  }
  console.log(`Movies Service running at http://0.0.0.0:${port}`);
  server.start();
});

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mysql = require('mysql');

const packageDefinition = protoLoader.loadSync('./protos/tvshows.proto');
const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const tvshowPackage = grpcObject.tvshows;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'microservice'
});

const server = new grpc.Server();

server.addService(tvshowPackage.TVShowService.service, {
  GetTVShows: (_, callback) => {
    connection.query('SELECT * FROM tvshows', (error, results) => {
      if (error) {
        callback({
          code: grpc.status.INTERNAL,
          details: 'Error retrieving TV shows from database'
        });
        return;
      }
      callback(null, { tvshows: results });
    });
  },
  GetTVShowById: (call, callback) => {
    const id = call.request.id;
    connection.query('SELECT * FROM tvshows WHERE id = ?', [id], (error, results) => {
      if (error) {
        callback({
          code: grpc.status.INTERNAL,
          details: 'Error retrieving TV show from database'
        });
        return;
      }
      if (results.length === 0) {
        callback({
          code: grpc.status.NOT_FOUND,
          details: 'TV Show not found'
        });
        return;
      }
      callback(null, results[0]);
    });
  },
  AddTVShow: (call, callback) => {
    const { title, genre, year } = call.request;
    connection.query('INSERT INTO tvshows (title, genre, year) VALUES (?, ?, ?)', [title, genre, year], (error, results) => {
      if (error) {
        callback({
          code: grpc.status.INTERNAL,
          details: 'Error adding TV show to database'
        });
        return;
      }
      const id = results.insertId;
      const newTVShow = { id, title, genre, year };
      callback(null, newTVShow);
    });
  },
  UpdateTVShow: (call, callback) => {
    const { id, title, genre, year } = call.request;
    connection.query('UPDATE tvshows SET title = ?, genre = ?, year = ? WHERE id = ?', [title, genre, year, id], (error, results) => {
      if (error || results.affectedRows === 0) {
        callback({
          code: grpc.status.NOT_FOUND,
          details: 'TV Show not found'
        });
        return;
      }
      const updatedTVShow = { id, title, genre, year };
      callback(null, updatedTVShow);
    });
  },
  DeleteTVShow: (call, callback) => {
    const id = call.request.id;
    connection.query('DELETE FROM tvshows WHERE id = ?', [id], (error, results) => {
      if (error || results.affectedRows === 0) {
        callback({
          code: grpc.status.NOT_FOUND,
          details: 'TV Show not found'
        });
        return;
      }
      callback(null, { success: true });
    });
  }
});

server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error(`Failed to bind server. Error: ${err}`);
    return;
  }
  console.log(`TV Shows Service running at http://0.0.0.0:${port}`);
  server.start();
});

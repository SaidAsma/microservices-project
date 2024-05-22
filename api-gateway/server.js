const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const schema = require('./schema');

const app = express();
app.use(express.json()); // Middleware pour analyser le corps de la requête en JSON


const movieProtoPath = '../movies-service/protos/movies.proto';
const tvshowProtoPath = '../tvshows-service/protos/tvshows.proto';

const moviePackageDef = protoLoader.loadSync(movieProtoPath);
const tvshowPackageDef = protoLoader.loadSync(tvshowProtoPath);

const movieGrpcObject = grpc.loadPackageDefinition(moviePackageDef).movies;
const tvshowGrpcObject = grpc.loadPackageDefinition(tvshowPackageDef).tvshows;

const movieClient = new movieGrpcObject.MovieService('localhost:50051', grpc.credentials.createInsecure());
const tvshowClient = new tvshowGrpcObject.TVShowService('localhost:50052', grpc.credentials.createInsecure());

const root = {
  // Fonctions pour gérer les requêtes GraphQL
  movies: () => {
    return new Promise((resolve, reject) => {
      movieClient.GetMovies({}, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response.movies);
        }
      });
    });
  },
  movie: (args) => {
    return new Promise((resolve, reject) => {
      movieClient.GetMovieById({ id: args.id }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  },
  addMovie: ({ title, genre, year }) => {
    return new Promise((resolve, reject) => {
      movieClient.AddMovie({ title, genre, year }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  },
  updateMovie: ({ id, title, genre, year }) => {
    return new Promise((resolve, reject) => {
      movieClient.UpdateMovie({ id, title, genre, year }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  },
  deleteMovie: ({ id }) => {
    return new Promise((resolve, reject) => {
      movieClient.DeleteMovie({ id }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response.success);
        }
      });
    });
  },

  // Fonctions pour gérer les requêtes REST
  getMoviesRest: (req, res) => {
    movieClient.GetMovies({}, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(200).send(response.movies);
      }
    });
  },
  addMovieRest: (req, res) => {
    const { title, genre, year } = req.body;
    movieClient.AddMovie({ title, genre, year }, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(201).send(response);
      }
    });
  },
  updateMovieRest: (req, res) => {
    const { id } = req.params;
    const { title, genre, year } = req.body;
    movieClient.UpdateMovie({ id, title, genre, year }, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(200).send(response);
      }
    });
  },
  deleteMovieRest: (req, res) => {
    const { id } = req.params;
    movieClient.DeleteMovie({ id }, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(204).send();
      }
    });
  },

  getTVShowsRest: (req, res) => {
    tvshowClient.GetTVShows({}, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(200).send(response.tvshows);
      }
    });
  },
  addTVShowRest: (req, res) => {
    const { title, genre, year } = req.body;
    tvshowClient.AddTVShow({ title, genre, year }, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(201).send(response);
      }
    });
  },
  updateTVShowRest: (req, res) => {
    const { id } = req.params;
    const { title, genre, year } = req.body;
    tvshowClient.UpdateTVShow({ id, title, genre, year }, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(200).send(response);
      }
    });
  },
  deleteTVShowRest: (req, res) => {
    const { id } = req.params;
    tvshowClient.DeleteTVShow({ id }, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(204).send();
      }
    });
  },
};


// Routes REST
app.get('/movies', root.getMoviesRest);
app.post('/movies', root.addMovieRest);
app.put('/movies/:id', root.updateMovieRest);
app.delete('/movies/:id', root.deleteMovieRest);

app.get('/tvshows', root.getTVShowsRest);
app.post('/tvshows', root.addTVShowRest);
app.put('/tvshows/:id', root.updateTVShowRest);
app.delete('/tvshows/:id', root.deleteTVShowRest);

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true
}));

app.listen(4000, '0.0.0.0', () => {
  console.log('API Gateway running at http://0.0.0.0:4000/graphql');
});

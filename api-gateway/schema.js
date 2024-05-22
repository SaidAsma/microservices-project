// api-gatway/schema.js
const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type Movie {
    id: String
    title: String
    genre: String
    year: Int
  }

  type TVShow {
    id: String
    title: String
    genre: String
    year: Int
  }

  type Query {
    movies: [Movie]
    movie(id: String!): Movie
    tvshows: [TVShow]
    tvshow(id: String!): TVShow
  }

  type Mutation {
    addMovie(title: String!, genre: String!, year: Int!): Movie
    deleteMovie(id: String!): Boolean
    updateMovie(id: String!, title: String!, genre: String!, year: Int!): Movie
    addTVShow(title: String!, genre: String!, year: Int!): TVShow 
    updateTVShow(id: String!, title: String!, genre: String!, year: Int!): TVShow
    deleteTVShow(id: String!): Boolean
  }

  
  
`);

module.exports = schema;

require('dotenv').config();

import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import expressGraphQL from 'express-graphql';
import { redirectToHTTPS } from 'express-http-to-https';
import mongoose from 'mongoose';
import recentClicks from './api/recentClicks';
import topClicks from './api/topClicks';
import buildDataloaders from './dataloaders';
import schema from './graphql/schema';

const app = express();

app.use(redirectToHTTPS([/localhost:(\d{4})/], undefined, 301));

if (process.env.NODE_ENV === 'development') {
  // Allow all cors requests on development
  app.use(cors());
}

///// Setup MongoDb connection
if (process.env.MONGO_URI === undefined) {
  throw new Error('You must provide a MongoAtlas URI');
}
if (process.env.MONGO_AUTH_SOURCE === undefined) {
  throw new Error('You must provide a MongoDB authSource');
}
if (process.env.MONGO_DATABASE_NAME === undefined) {
  throw new Error('You must provide a dbName');
}

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI, {
  authSource: process.env.MONGO_AUTH_SOURCE,
  dbName: process.env.MONGO_DATABASE_NAME,
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection
  // tslint:disable-next-line
    .once('open', () => console.log('Connected to MongoLab instance.'))
  // tslint:disable-next-line
    .on('error', error => console.log('Error connecting to MongoLab:', error));

const graphiql = process.env.NODE_ENV === 'development' ? true : false;
const dataloaders = buildDataloaders();
app.use(bodyParser.json());
app.use('/graphql', expressGraphQL((req: any) => ({
  schema,
  graphiql,
  context: {
    dataloaders,
    user: req.user,
  },
})));
///// End MongoDb Connection Setup

if (process.env.NODE_ENV === 'production') {

  app.get('/api/recent_clicks', async (req, res) => {
    try {
      const limit = req.query && req.query.limit ? parseInt(req.query.limit, 10)  : 10;
      const businesses = await recentClicks({limit});
      res.json(businesses);
    } catch (err) {
      res.status(500);
      res.send(err);
    }
  });

  app.get('/api/top_clicks', async (req, res) => {
    try {
      const limit = req.query && req.query.limit ? parseInt(req.query.limit, 10)  : 10;
      const lat = req.query && req.query.lat ? parseFloat(req.query.lat)  : undefined;
      const lng = req.query && req.query.lng ? parseFloat(req.query.lng)  : undefined;
      const range = req.query && req.query.range ? parseFloat(req.query.range)  : undefined;
      const businesses = await topClicks({limit, lat, lng, range});
      res.json(businesses);
    } catch (err) {
      res.status(500);
      res.send(err);
    }
  });

  const path = require('path');

  // Express will serve up production assets
  // like our main.js or main.css file
  app.use(express.static('client/build'));

  // Express will serve up index.html if it
  // does not recognize the route
  // routingWithMetaData(app);

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../client', 'build', 'index.html'));
  });
}

export default app;

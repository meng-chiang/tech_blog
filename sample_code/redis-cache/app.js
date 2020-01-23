'use strict'

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const redisClient = new Redis({
  port: 6379, // Redis port
  host: "127.0.0.1", // Redis host
  family: 4, // 4 (IPv4) or 6 (IPv6)
  db: 0
});

const urlController = require('./controller/url.controller.js');
const Url = require('./models').Url;

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

urlController.init({
  app,
  ormUrl: Url,
  redisClient
});


app.listen( 3000, () => console.log('Server is listening Port 3000') )

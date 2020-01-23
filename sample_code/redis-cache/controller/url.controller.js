'use strict'

module.exports = {
  init: initAPIs
};

function initAPIs(context) {
  const app = context.app;
  const ormUrl = context.ormUrl;
  const redisClient = context.redisClient;

  if (!app) {
    throw new Error('INVALID EXPRESS APP');
  }

  app.post('/short_url', [
    postParamCheck,
    checkUrlExist(ormUrl),
    storeUrl(ormUrl, redisClient),
  ]);

  app.get('/:short_url', [
    getParamCheck,
    checkRedis(redisClient),
    checkMysql(ormUrl, redisClient)
  ]);
}

function postParamCheck(req, res, next) {
  if (!req.body.url || req.body.url === "")
    return res.send("MISSING URL PARAMETER");

  next();
}

function getParamCheck(req, res, next) {
  if (!req.params.short_url || req.params.short_url === "")
    return res.send("MISSING SHORT URL PARAMETER");
  next();
}

function checkUrlExist(ormUrl) {
  return function(req, res, next) {
    ormUrl.findAll({
      where: { url: req.body.url }
    }).then(urls => {
      if (urls.length !== 0 && urls[0].short_url)
        return res.send({short_url: urls[0].short_url})
      next();
    }).catch(e => res.send(e))
  }
}

function storeUrl(ormUrl, redisClient) {
  return function(req, res, next) {
    const short_url = randomString(8);
    ormUrl.create({
      url: req.body.url,
      short_url,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .then(() => redisClient.set(short_url, req.body.url, 'ex', 60*60*24*7))
    .then(() => es.send({ short_url }))
    .catch(e => res.send(e))
  }
}

function checkRedis(redisClient) {
  return function(req, res, next) {
    redisClient.get(req.params.short_url)
      .then(result => {
        if (result !== null)
          return res.send({ url: result });
        next();
      })
      .catch(err => res.send(err))
  }
}

function checkMysql(ormUrl, redisClient) {
  return function(req, res) {
    ormUrl.findAll({
      where: { short_url: req.params.short_url }
    }).then(urls => {
      if (urls.length !== 0 && urls[0].url) {
        redisClient.set(req.params.short_url, urls[0].url, 'ex', 60*60*24*7)
        res.send({ url: urls[0].url })
      } else {
        res.send('SHORT URL DOES NOT MATCH')
      }
    }).catch(e => res.send(e))
  }
}

function randomString(digits){

  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < digits; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;

}
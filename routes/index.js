var express = require('express');
var router = express.Router();
let steem = require('steem')
let config = require('../config')
let util = require('../modules/util')
const winston = require('winston')
const fs = require('fs');
const path = require('path');
const filename = path.join(__dirname, '../logs/vote.log');


const whitelist = config.whitelist

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: filename
    })
  ]
});

steem.api.setOptions({
  url: 'https://api.steemit.com'
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Utopian'
  });
});

router.get('/dashboard', util.isMod, function(req, res, next) {
  let cm = req.session.steemconnect.name;
  logger.log({
    level: 'info',
    message: `${cm} logged in`
  });

  let isWhitelisted = false

  for(mod of whitelist)
  {
    if(mod === cm)
      isWhitelisted = true
  }
  res.render('dashboard', {
    isWhitelisted
  });
});

router.post('/vote', util.isMod, async function(req, res, next) {

  let cm = req.session.steemconnect.name;
  let isWhitelisted = false
  for(mod of whitelist)
  {
    if(mod === cm)
      isWhitelisted = true
  }
  let tip=1
  if(isWhitelisted)
    tip = req.body.megatip? 3:1
  try {
    let link = req.body.q
    let weight = 100*tip
    let regex = /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/;
    let match = regex.exec(link)
    // console.log(match);
    let comment;
    let author;
    let permlink;
    if (match[17]) {
      comment = match[17].split("/")
      author = comment[0].substring(2)
      permlink = comment[1];
    } else if (match[13]) {
      comment = match[13].split("/")
      author = comment[2].substring(1)
      permlink = comment[3];
    }
    else {
      res.redirect('/fail')
    }
    console.log(author, permlink);
    if (cm == author) {
      logger.log({
        level: 'info',
        message: `${cm} tried to vote himself`
      });
      res.redirect('/fail')
    } else {
      steem.api.getContent(author, permlink, function(err, result) {
        console.log(err, result);
        if (err) {
          res.redirect('/fail')
        } else {
          let depth = result.depth;
          if (depth < 1) {
            logger.log({
              level: 'info',
              message: `${cm} tried to vote ${author} ${permlink} which was a root post instead of comment`
            });
            res.redirect('/fail')
          } else {
            console.log(`Weight: ${weight}`);
            steem.broadcast.vote(config.posting, config.voter, author, permlink, weight, function(err, result) {
              let parentAuthor = author;
              let parentPermlink = permlink;
              if (err) {
                console.log(err);
                res.redirect('/fail')
              } else {
                logger.log({
                  level: 'info',
                  message: `${cm} voted ${parentAuthor} ${parentPermlink} with ${weight}`
                });
                let permlink = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
                let body = `Hey @${author}\nHere's a tip for your valuable feedback! @Utopian-io loves and incentivises informative comments.\n\n**Contributing on Utopian**\nLearn how to contribute on <a href="https://join.utopian.io">our website</a>.\n\n**Want to chat? Join us on Discord https://discord.gg/h52nFrV.**\n\n<a href="https://v2.steemconnect.com/sign/account-witness-vote?witness=utopian-io&approve=1">Vote for Utopian Witness!</a>`;
                steem.broadcast.comment(config.posting, parentAuthor, parentPermlink, config.voter, permlink, '', body, {
                  tags: ['utopian.tip'],
                  app: 'utopian-io'
                }, function(err, result) {
                  if (err) {
                    console.log(err);
                    res.redirect('/fail')
                  } else {
                    res.redirect('/success')
                  }
                });
              }
            });
          }
        }
      });
    }
  } catch (e) {
    res.redirect('/fail');
  }
});


router.get('/success', util.isMod, function(req, res, next) {
  res.render('success')
})

router.get('/fail', util.isMod, function(req, res, next) {
  res.render('fail')
})

module.exports = router;

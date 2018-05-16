var express = require('express');
var router = express.Router();
let steem = require('steem')
let config = require('../config')
let util = require('../modules/util')

steem.api.setOptions({ url: 'https://api.steemit.com' });

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Utopian'
  });
});

router.get('/dashboard', util.isMod, function(req, res, next) {
  res.render('dashboard');
});

router.post('/vote', util.isMod, async function(req, res, next) {
  try {
    let link = req.body.q
    let weight = 100
    let regex = /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/;
    let match = regex.exec(link)
    console.log(match);
    let comment = match[17].split("/")
    let author = comment[0].substring(2)
    let permlink = comment[1];
    steem.api.getContent(author, permlink, function(err, result) {
      console.log(err, result);
      if (err)
        res.redirect('/fail')
      else {
        let depth = result.depth;
        if(depth < 1) {
          console.log('Its a root post and not a comment');
          res.redirect('/fail')
        }
        else {
        steem.broadcast.vote(config.posting, config.voter, author, permlink, weight, function(err, result) {
          let parentAuthor = author;
          let parentPermlink = permlink;
          if (err) {
            console.log(err);
            res.redirect('/fail')
          }
          else {
            let permlink = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
            let body = `Hey @${author},\nHere's a tip for your valuable feedback! @utopian-io loves and incentives informative comments.\n\n**Contributing on Utopian**\nLearn how to contribute on <a href="https://join.utopian.io">our website</a>.\n\n**Want to chat? Join us on Discord https://discord.gg/h52nFrV.**\n\n<a href="https://v2.steemconnect.com/sign/account-witness-vote?witness=utopian-io&approve=1">Vote for Utopian Witness!</a>`;
            steem.broadcast.comment(config.posting, parentAuthor, parentPermlink, config.voter, permlink, '', body, {
              tags: ['utopian.tip'],
              app: 'utopian-io'
            }, function(err, result) {
              if(err) {
                console.log(err);
                res.redirect('/fail')
              }
              else {
              res.redirect('/success')
            }
            });
          }
        });
      }
    }
    });
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

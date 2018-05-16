let express = require('express')
let steem = require('../modules/steemconnect')
let router = express.Router()

/* GET auth listing. */
router.get('/', (req, res, next) => {
  if (!req.query.access_token) {
    let uri = steem.getLoginURL()
    uri = `https://v2.steemconnect.com/oauth2/authorize?client_id=utopianpay&redirect_uri=http://localhost/auth&scope=login,vote,comment,comment_options,offline,custom_json,claim_reward_balance,delete_comment`;
    res.redirect(uri)
  } else {
    steem.setAccessToken(req.query.access_token)
    steem.me((err, steemResponse) => {
      if (err) res.redirect('/')
      console.log('yaha aaya hai');
      req.session.token = req.query.access_token
      req.session.steemconnect = steemResponse.account
      res.redirect('/dashboard')
    })
  }
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

module.exports = router

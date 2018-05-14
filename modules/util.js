let config = require('../config')

module.exports.isMod = async (req, res, next) => {
  if (res.logged && res.mod) {
    next()
  } else {
    res.redirect('/')
  }
}

module.exports.getIfMod = (account) => {
  let isMod = false;
  let mods = config.moderators;
  for (moderator of mods) {
    if (account === moderator) {
      isMod = true;
      break;
    }
  }
  console.log(account);
  return isMod;
}

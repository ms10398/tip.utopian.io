var createError = require('http-errors');
var express = require('express');
var path = require('path');
let session = require('express-session')
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let util = require('./modules/util')
let config = require('./config')

var indexRouter = require('./routes/index');
var auth = require('./routes/auth');

var app = express();

app.use(session({
  secret: config.session.secret,
  saveUninitialized: true,
  resave: true
}))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(async function (req, res, next) {
  if (req.session.steemconnect) {
    res.logged = true
    res.mod = await util.getIfMod(req.session.steemconnect.name)
  } else {
    res.logged = false
    res.mod = false
  }
  next()
})

app.use('/', indexRouter);
app.use('/auth', auth);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'production' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

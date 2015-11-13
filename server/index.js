'use strict'

const app = require('koa.io')()
const spa = require('koa-spa')
const path = require('path')
const port = process.env.PORT || 8080

// Hot dev server
if ( process.env.NODE_ENV === 'development' ) {
  console.log('Running development server...');

  const webpack = require('webpack')
  const devMiddleware = require('koa-webpack-dev-middleware')
  const hotMiddlware = require('koa-webpack-hot-middleware')
  const config = require('../webpack.config').dev
  const compiler = webpack(config)

  app.use(devMiddleware(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath
  }))

  app.use(hotMiddlware(compiler))
}

app.use(spa(path.resolve(__dirname, '../client'), {
  index: 'index.html',
  routeBase: '/',
}));

app.listen(port, function () {
  console.log('Server listening at port %d', port)
})

// Chatroom

// usernames which are currently connected to the chat
const usernames = {}
let numUsers = 0

// middleware for connect and disconnect
app.io.use(function* userLeft(next) {
  // on connect
  console.log('somebody connected')
  // console.log(this.headers)
  yield* next
  // on disconnect
  if (this.addedUser) {
    delete usernames[this.username]
    --numUsers

    // echo globally that this client has left
    this.broadcast.emit('user left', {
      username: this.username,
      numUsers: numUsers
    })
  }
})


/**
 * router for socket event
 */

app.io.route('add user', function* (next, username) {
  // we store the username in the socket session for this client
  this.username = username
  // add the client's username to the global list
  usernames[username] = username
  ++numUsers
  this.addedUser = true
  this.emit('login', {
    numUsers: numUsers
  })

  // echo globally (all clients) that a person has connected
  this.broadcast.emit('user joined', {
    username: this.username,
    numUsers: numUsers
  })
})

// when the client emits 'new message', this listens and executes
app.io.route('new message', function* (next, message) {
  // we tell the client to execute 'new message'
  this.broadcast.emit('new message', {
    username: this.username,
    message: message
  })
})

// when the client emits 'typing', we broadcast it to others
app.io.route('typing', function* () {
  console.log('%s is typing', this.username)
  this.broadcast.emit('typing', {
    username: this.username
  })
})

// when the client emits 'stop typing', we broadcast it to others
app.io.route('stop typing', function* () {
  console.log('%s is stop typing', this.username)
  this.broadcast.emit('stop typing', {
    username: this.username
  })
})

import React from 'react'
import { render } from 'react-dom'
import io from 'socket.io-client'
import { throttle } from 'lodash'
import './style.css'

const LoginPage = React.createClass({
  propTypes: {
    onSubmit: React.PropTypes.func,
  },

  handleSubmit(event) {
    event.preventDefault()
    this.props.onSubmit(this.userInput.value)
  },

  componentDidMount() {
    this.userInput.focus()
  },

  render() {
    return (
      <div className="login page">
        <form className="form"
          onSubmit={this.handleSubmit}>
          <h3 className="title">What's your name?</h3>
          <input
            ref={(ref) => this.userInput = ref}
            className="usernameInput"
            type="text"
            maxLength="14" />
          </form>
      </div>
    )
  },
})

const ChatPage = React.createClass({
  propTypes : {
    messages: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    typing: React.PropTypes.string, // name of other person who is typing
    onSubmit: React.PropTypes.func,
    socket: React.PropTypes.object,
    typingTimerLen: React.PropTypes.number,
    typingThrottleDuration: React.PropTypes.number,
  },

  getDefaultProps() {
    return {
      typingTimerLen: 1000, // 1 second
      typingThrottleDuration: 500,
    }
  },

  getInitialState() {
    this.emitTyping = throttle(this._emitTyping, this.props.typingThrottleDuration)
    return {
      message: '',
      lastTypeTime: 0,
    }
  },

  componentDidMount() {
    this.textInput.focus()
  },

  handleKeyDown({ key }) {
    if ( key === 'Enter' ) {
      this.props.onSubmit(this.state.message)
      this.setState({ message: '' })
      this.props.socket.emit('stop typing')
    }
  },

  _emitTyping() {
    this.props.socket.emit('typing')
  },

  handleChange(event) {
    this.setState({
      message: event.target.value,
      lastTypeTime: +new Date(),
    })
    this.emitTyping()
    setTimeout(() => {
      if ( +new Date() - this.state.lastTypeTime > this.props.typingTimerLen ) {
        this.props.socket.emit('stop typing')
      }
    }, this.props.typingTimerLen )
  },

  render() {
    const { messages, typing } = this.props
    let typingIndicator
    if ( typing ) {
      typingIndicator = <div className="typing message">{`${typing} is typing...`}</div>
    }
    return (
      <div className="chatPage">
        <ul className="chatArea messages">
          {this.props.messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
          {typingIndicator}
        </ul>
        <input
          ref={(ref) => this.textInput = ref}
          value={this.state.message}
          onKeyDown={this.handleKeyDown}
          onChange={this.handleChange}
          className="inputMessage"
          placeholder="Type here..."/>
      </div>
    )
  }
})

const App = React.createClass({
  getInitialState() {
    this.setupSocket()
    return {
      username: null,
      messages: [],
      typing: null,
    }
  },

  setupSocket() {
    const { socket } = this.props
    // Socket events
    // Whenever the server emits 'login', log the login message
    socket.on('login', ({ numUsers }) => {
      // Display the welcome message
      this.setState({
        messages: this.state.messages.concat([
          'Welcome to Socket.io chat!',
          `There are ${numUsers} here`,
        ]),
      })
    })

    socket.on('new message', ({ message, username }) => {
      this.setState({
        messages: this.state.messages.concat(`${username}: ${message}`)
      })
    })

    socket.on('user joined', ({ username, numUsers }) => {
      this.setState({
        messages: this.state.messages.concat([
          `${username} joined (${numUsers} here)`,
        ])
      })
    })

    socket.on('user left', ({ username, numUsers }) => {
      this.setState({
        messages: this.state.messages.concat([
          `${username} left (${numUsers} still here)`,
        ])
      })
    })

    socket.on('typing', ({ username }) => {
      if ( username !== this.state.username ) {
        this.setState({
          typing: username,
        })
      }
    })

    socket.on('stop typing', () => {
      this.setState({
        typing: null,
      })
    })
  },

  login(username) {
    this.props.socket.emit('add user', username)
    this.setState({ username })
  },

  sendMessage(message) {
    if ( !message ) return // don't send empty messages

    this.props.socket.emit('new message', message, (res) => {
      console.log("res!!", res);
    })
    this.setState({
      messages: this.state.messages.concat(message)
    })
  },

  render() {
    if ( !this.state.username ) {
      return <LoginPage onSubmit={this.login} />
    } else {
      return (
        <ChatPage
          onSubmit={this.sendMessage}
          messages={this.state.messages}
          typing={this.state.typing}
          socket={this.props.socket} />
      )
    }
  }
})

const socket = io()
render(<App socket={socket} />, document.getElementById('root'))

// $(function() {
//   var FADE_TIME = 150; // ms
//   var TYPING_TIMER_LENGTH = 400; // ms
//   var COLORS = [
//     '#e21400', '#91580f', '#f8a700', '#f78b00',
//     '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
//     '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
//   ];

//   // Initialize varibles
//   var $window = $(window);
//   var $usernameInput = $('.usernameInput'); // Input for username
//   var $messages = $('.messages'); // Messages area
//   var $inputMessage = $('.inputMessage'); // Input message input box

//   var $loginPage = $('.login.page'); // The login page
//   var $chatPage = $('.chat.page'); // The chatroom page

//   // Prompt for setting a username
//   var username;
//   var connected = false;
//   var typing = false;
//   var lastTypingTime;
//   var $currentInput = $usernameInput.focus();



//   function addParticipantsMessage (data) {
//     var message = '';
//     if (data.numUsers === 1) {
//       message += "there's 1 participant";
//     } else {
//       message += "there are " + data.numUsers + " participants";
//     }
//     log(message);
//   }

//   // Sets the client's username
//   function setUsername () {
//     username = cleanInput($usernameInput.val().trim());

//     // If the username is valid
//     if (username) {
//       $loginPage.fadeOut();
//       $chatPage.show();
//       $loginPage.off('click');
//       $currentInput = $inputMessage.focus();

//       // Tell the server your username
//       ;
//     }
//   }

//   // Sends a chat message
//   function sendMessage () {
//     var message = $inputMessage.val();
//     // Prevent markup from being injected into the message
//     message = cleanInput(message);
//     // if there is a non-empty message and a socket connection
//     if (message && connected) {
//       $inputMessage.val('');
//       addChatMessage({
//         username: username,
//         message: message
//       });
//       // tell server to execute 'new message' and send along one parameter
//       socket.emit('new message', message);
//     }
//   }

//   // Log a message
//   function log (message, options) {
//     var $el = $('<li>').addClass('log').text(message);
//     addMessageElement($el, options);
//   }

//   // Adds the visual chat message to the message list
//   function addChatMessage (data, options) {
//     // Don't fade the message in if there is an 'X was typing'
//     var $typingMessages = getTypingMessages(data);
//     options = options || {};
//     if ($typingMessages.length !== 0) {
//       options.fade = false;
//       $typingMessages.remove();
//     }

//     var $usernameDiv = $('<span class="username"/>')
//       .text(data.username)
//       .css('color', getUsernameColor(data.username));
//     var $messageBodyDiv = $('<span class="messageBody">')
//       .text(data.message);

//     var typingClass = data.typing ? 'typing' : '';
//     var $messageDiv = $('<li class="message"/>')
//       .data('username', data.username)
//       .addClass(typingClass)
//       .append($usernameDiv, $messageBodyDiv);

//     addMessageElement($messageDiv, options);
//   }

//   // Adds the visual chat typing message
//   function addChatTyping (data) {
//     data.typing = true;
//     data.message = 'is typing';
//     addChatMessage(data);
//   }

//   // Removes the visual chat typing message
//   function removeChatTyping (data) {
//     getTypingMessages(data).fadeOut(function () {
//       $(this).remove();
//     });
//   }

//   // Adds a message element to the messages and scrolls to the bottom
//   // el - The element to add as a message
//   // options.fade - If the element should fade-in (default = true)
//   // options.prepend - If the element should prepend
//   //   all other messages (default = false)
//   function addMessageElement (el, options) {
//     var $el = $(el);

//     // Setup default options
//     if (!options) {
//       options = {};
//     }
//     if (typeof options.fade === 'undefined') {
//       options.fade = true;
//     }
//     if (typeof options.prepend === 'undefined') {
//       options.prepend = false;
//     }

//     // Apply options
//     if (options.fade) {
//       $el.hide().fadeIn(FADE_TIME);
//     }
//     if (options.prepend) {
//       $messages.prepend($el);
//     } else {
//       $messages.append($el);
//     }
//     $messages[0].scrollTop = $messages[0].scrollHeight;
//   }

//   // Prevents input from having injected markup
//   function cleanInput (input) {
//     return $('<div/>').text(input).text();
//   }

//   // Updates the typing event
//   function updateTyping () {
//     if (connected) {
//       if (!typing) {
//         typing = true;
//         socket.emit('typing');
//       }
//       lastTypingTime = (new Date()).getTime();

//       setTimeout(function () {
//         var typingTimer = (new Date()).getTime();
//         var timeDiff = typingTimer - lastTypingTime;
//         if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
//           socket.emit('stop typing');
//           typing = false;
//         }
//       }, TYPING_TIMER_LENGTH);
//     }
//   }

//   // Gets the 'X is typing' messages of a user
//   function getTypingMessages (data) {
//     return $('.typing.message').filter(function (i) {
//       return $(this).data('username') === data.username;
//     });
//   }

//   // Gets the color of a username through our hash function
//   function getUsernameColor (username) {
//     // Compute hash code
//     var hash = 7;
//     for (var i = 0; i < username.length; i++) {
//        hash = username.charCodeAt(i) + (hash << 5) - hash;
//     }
//     // Calculate color
//     var index = Math.abs(hash % COLORS.length);
//     return COLORS[index];
//   }

//   // Keyboard events

//   $window.keydown(function (event) {
//     // Auto-focus the current input when a key is typed
//     if (!(event.ctrlKey || event.metaKey || event.altKey)) {
//       $currentInput.focus();
//     }
//     // When the client hits ENTER on their keyboard
//     if (event.which === 13) {
//       if (username) {
//         sendMessage();
//         socket.emit('stop typing');
//         typing = false;
//       } else {
//         setUsername();
//       }
//     }
//   });

//   $inputMessage.on('input', function() {
//     updateTyping();
//   });

//   // Click events

//   // Focus input when clicking anywhere on login page
//   $loginPage.click(function () {
//     $currentInput.focus();
//   });

//   // Focus input when clicking on the message input's border
//   $inputMessage.click(function () {
//     $inputMessage.focus();
//   });

// });


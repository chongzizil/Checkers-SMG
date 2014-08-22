/*global window, console, document */
/*
 //multiplayer-gaming.com/api.js
 */
var platform = (function () {
  var isPassAndPlay;
  var isPlayAgainstTheComputer;
  var urlPlayersNumber;
  var game;
  var minNumberOfPlayers;
  var maxNumberOfPlayers;

  var currentState;
  var lastState;
  var currentVisibleTo;
  var lastVisibleTo;
  var lastMove;
  var turnIndexBeforeMove;
  var turnIndexAfterMove;
  var setTurnOrEndMatchCount;
  var allPlayerIds;
  var playersInfo;

  // private methods
  var makeMoveCallback;

  function parseUrl() {
    var url = window.location.search;
    isPassAndPlay = new RegExp("PassAndPlay", "i").exec(url) !== null;
    isPlayAgainstTheComputer = new RegExp("PlayAgainstTheComputer", "i").exec(url) !== null;
    var playersNumberMatch = new RegExp("PlayersNumber=([0-9])+", "i").exec(url);
    urlPlayersNumber = playersNumberMatch === null ? 2 : parseInt(playersNumberMatch[1], 10);
  }
  parseUrl();

  function init() {
    currentState = {};
    lastState = null;
    currentVisibleTo = {};
    lastVisibleTo = null;
    lastMove = [];
    allPlayerIds = [];
    playersInfo = [];
    for (var i = 0; i < urlPlayersNumber; i++) {
      var playerId = "" + (i + 42);
      allPlayerIds.push(playerId);
      playersInfo.push({playerId : playerId});
    }
    turnIndexBeforeMove = 0;
    turnIndexAfterMove = 0;
  }

  //Function to get the keys from a JSON object
  function getKeys(object) {
    var keys = [];
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    return keys;
  }

  function clone(obj) {
    var str = JSON.stringify(obj);
    var copy = JSON.parse(str);
    return copy;
  }

  function isNull(obj) {
    return obj === undefined || obj === null;
  }

  function throwError() {
    console.log("Throwing an error with these arguments=", arguments);
    throw new Error(Array.prototype.join.call(arguments, ", "));
  }

  function get(obj, field) {
    if (isNull(obj[field])) {
      throwError("You must have a field named '", field, "' in this object=", obj);
    }
    return obj[field];
  }

  function getMoveForPlayerIndex(playerIndex, move) {
    var moveForPlayer = [];
    for (var k = 0; k < move.length; k++) {
      var operation = move[k];
      if (!isNull(operation.set) &&
          !isNull(operation.set.visibleToPlayerIndexes) &&
          operation.set.visibleToPlayerIndexes.indexOf(playerIndex) === -1) {
        moveForPlayer.push({
          type : "Set",
          key : operation.set.key,
          value : null,
          visibleToPlayerIndexes : operation.set.visibleToPlayerIndexes
        });
      } else {
        moveForPlayer.push(operation);
      }
    }
    return moveForPlayer;
  }

  function getStateForPlayerIndex(playerIndex, gameState, visibleTo) {
    if (gameState === null) {
      return null;
    }
    var result = {};
    var keys = getKeys(gameState);
    for (var k = 0; k < keys.length; k++) {
      var visibleToPlayerIndexes = visibleTo[keys[k]];
      var value = null;
      if (isNull(visibleToPlayerIndexes) || visibleToPlayerIndexes.indexOf(playerIndex) > -1) {
        value = gameState[keys[k]];
      }
      result[keys[k]] = value;
    }
    return result;
  }

  function shuffle(keys) {
    var keysCopy = keys.slice(0);
    var result = [];
    while (keysCopy.length >= 1) {
      var index = Math.floor(Math.random() * keysCopy.length);
      var removed = keysCopy.splice(index, 1);
      result.push(removed);
    }
    return result;
  }

  function convertPlayerIdsToPlayerIndexes(playerIds) {
    if (playerIds === undefined || playerIds === null || playerIds === "ALL") {
      return null;
    }
    var playerIndexes = [];
    for (var i = 0; i < playerIds.length; i++) {
      var playerId = playerIds[i];
      var playerIndex = allPlayerIds.indexOf(playerId);
      if (playerIndex === -1) {
        throw Error("Cannot find playerId=" + playerId + " in " + allPlayerIds);
      }
      playerIndexes.push(playerIndex);
    }
    return playerIndexes;
  }

  function processApiOperation(operation) {
    //Check for all types of Operations
    var key;
    var op;
    var visibleToPlayerIndexes;
    if (!isNull(operation.set)) {
      op = operation.set;
      key = op.key;
      visibleToPlayerIndexes = op.visibleToPlayerIndexes;
      var value = op.value;
      if (isNull(key) || isNull(value)) {
        throwError("Fields key and value in Set operation must be non null. operation=" + JSON.stringify(operation));
      }
      currentState[key] = value;
      currentVisibleTo[key] = visibleToPlayerIndexes;
    } else if (!isNull(operation.setTurn)) {
      op = operation.setTurn;
      turnIndexAfterMove = get(op, "turnIndex");
      setTurnOrEndMatchCount++;
    } else if (!isNull(operation.setRandomInteger)) {
      op = operation.setRandomInteger;
      key = op.key;
      var from = op.from;
      var to = op.to;
      if (isNull(key) || isNull(from) || isNull(to)) {
        throwError("Fields key, from, and to, in SetRandomInteger operation must be non null. operation=" + JSON.stringify(operation));
      }
      var randomValue = Math.floor((Math.random() * (to - from)) + from);
      currentState[key] = randomValue;
      currentVisibleTo[key] = null;
    } else if (!isNull(operation.setVisibility)) {
      op = operation.setVisibility;
      key = op.key;
      visibleToPlayerIndexes = op.visibleToPlayerIndexes;
      if (isNull(key)) {
        throwError("Fields key in SetVisibility operation must be non null. operation=" + JSON.stringify(operation));
      }
      currentVisibleTo[key] = visibleToPlayerIndexes;
    } else if (!isNull(operation['delete'])) {
      op = operation['delete'];
      key = op.key;
      if (isNull(key)) {
        throwError("Field key in Delete operation must be non null. operation=" + JSON.stringify(operation));
      }
      delete currentState[key];
      delete currentVisibleTo[key];
    } else if (!isNull(operation.shuffle)) {
      op = operation.shuffle;
      var keys = op.keys;
      if (isNull(keys) || (keys.length === 0)) {
        throwError("Field keys in Shuffle operation must be a non empty array. operation=" + JSON.stringify(operation));
      }
      var shuffledKeys = shuffle(keys);
      var oldGameState = clone(currentState);
      var oldVisibleTo = clone(currentVisibleTo);
      for (var j = 0; j < shuffledKeys.length; j++) {
        var fromKey = keys[j];
        var toKey = shuffledKeys[j];
        currentState[toKey] = oldGameState[fromKey];
        currentVisibleTo[toKey] = oldVisibleTo[fromKey];
      }
    } else if (!isNull(operation.endMatch)) {
      op = operation.endMatch;
      setTurnOrEndMatchCount++;
      var scores = op.endMatchScores;
      if (isNull(scores) || scores.length !== allPlayerIds.length) {
        throwError("Field scores in EndMatch operation must be an array of the same length as the number of players. operation=" + JSON.stringify(operation));
      }
      window.alert("EndMatch with scores=" + JSON.stringify(scores));
      init();
    } else {
      throwError("Illegal operation, it must contain either set, setRandomInteger, setVisibility, delete, shuffle, or endMatch: " + JSON.stringify(operation));
    }
  }

  function hackerFoundCallback(params) {
    var gameDeveloperEmail = get(params, 'gameDeveloperEmail');
    var emailSubject = get(params, 'emailSubject');
    var emailBody = get(params, 'emailBody');
    // TODO: email the developer.
    throwError("Declared a hacker");
  }

  function sendUpdateUi() {
    var moveForIndex = getMoveForPlayerIndex(turnIndexAfterMove, lastMove);
    var stateBeforeMove = getStateForPlayerIndex(turnIndexAfterMove, lastState, lastVisibleTo);
    var stateAfterMove = getStateForPlayerIndex(turnIndexAfterMove, currentState, currentVisibleTo);
    if (game.isMoveOk(
        {
          move : moveForIndex,
          turnIndexBeforeMove : turnIndexBeforeMove,
          turnIndexAfterMove : turnIndexAfterMove,
          stateBeforeMove : stateBeforeMove,
          stateAfterMove : stateAfterMove
        }) !== true) {
      throwError("You declated a hacker for a legal move! move=" + moveForIndex);
    }
    game.updateUI(
        {
          move : moveForIndex,
          turnIndexBeforeMove : turnIndexBeforeMove,
          turnIndexAfterMove : turnIndexAfterMove,
          stateBeforeMove : stateBeforeMove,
          stateAfterMove : stateAfterMove,
          yourPlayerIndex : turnIndexAfterMove,
          matchId : 1,
          createdTimestampMillis : 0,
          lastMoveTimestampMillis : 0,
          endMatchScores : null,
          endMatchReason : null,
          playersInfo : playersInfo,
          tokens : 0,
          makeMoveCallback : makeMoveCallback
        });
  }

  makeMoveCallback = function (operations) {
    lastState = clone(currentState);
    lastVisibleTo = clone(currentVisibleTo);
    turnIndexBeforeMove = turnIndexAfterMove;
    turnIndexAfterMove = -1;
    lastMove = operations;
    setTurnOrEndMatchCount = 0;
    for (var i = 0; i < lastMove.length; i++) {
      processApiOperation(lastMove[i]);
    }
    // We must have either SetTurn or EndMatch (and EndMatch calls init, which sets turnIndexAfterMove)
    if (setTurnOrEndMatchCount !== 1) {
      throwError("We must have either SetTurn or EndMatch, but not both");
    }
    if (!(turnIndexAfterMove >= 0 && turnIndexAfterMove < allPlayerIds.length)) {
      throwError("Parameter turnIndexAfterMove in makeMoveCallback must be between 0 and " + allPlayerIds.length + ", but it was " + turnIndexAfterMove + ".");
    }
    sendUpdateUi();
  };

  function setGame(_game) {
    game = _game;
    get(game, "getGameDeveloperEmail");
    get(game, "isMoveOk");
    get(game, "updateUI");
  }

  function showUI(params) {
    minNumberOfPlayers = get(params, "minNumberOfPlayers");
    maxNumberOfPlayers = get(params, "maxNumberOfPlayers");
    init();
    sendUpdateUi();
  }

  var secretCode = null;
  var callbackWaitingForReply = [];
  var serverApiIframe = null;
  function sendMessage(msg, callback) {
    console.log("Platform sent message ", msg, " in position ", callbackWaitingForReply.length);
    if (secretCode === null) {
      throwError("You cannot send a message using ServerApi before server_api.html finished loading and sent the secretCode");
    }
    callbackWaitingForReply.push(callback);
    serverApiIframe.contentWindow.postMessage(
        {id: callbackWaitingForReply.length - 1, secretCode: secretCode, msg: msg}, "*");
  }

  function gotSecretCode() {
    sendMessage([{"getServerApi": {"serverApiResult": "CLOSURE_TYPES_RESULT"}}], function (response) {
      console.log("ServerApi closure types: ", response);
    });
  }

  function listenMessage(event) {
    var msg = event.data;
    console.log("Platform got message", msg);
    if (secretCode === null) {
      secretCode = eval(msg);
      gotSecretCode();
    } else {
      var callbackPosition = get(msg, 'id');
      var reply = get(msg, 'reply');
      var callback = get(callbackWaitingForReply, callbackPosition);
      delete callbackWaitingForReply[callbackPosition];
      callback(reply);
    }
  }

  // Loads server_api.html in an iframe
  function loadServerApi() {
    console.log("loadServerApi was called");
    if (serverApiIframe !== null) {
      throwError("You called loadServerApi twice!");
    }
    if (window.addEventListener) {
      window.addEventListener("message", listenMessage, false);
    } else {
      window.attachEvent("onmessage", listenMessage);
    }
    serverApiIframe = document.createElement("IFRAME");
    serverApiIframe.setAttribute("src", "server_api.html"); // TODO: //multiplayer-gaming.appspot.com/
    serverApiIframe.style.width = "0px";
    serverApiIframe.style.height = "0px";
    document.body.appendChild(serverApiIframe);
  }

  return {setGame : setGame, showUI: showUI, loadServerApi: loadServerApi};
}) ();
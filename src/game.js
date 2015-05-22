/**
 * This is the controller for Checkers.
 */
angular.module('myApp')
    .controller('CheckersCtrl',
    ['$scope', '$log', '$timeout', '$translate',
      'gameService', 'stateService',
      'checkersLogicService', 'checkersAiService',
      'resizeGameAreaService', 'dragAndDropService',
      function ($scope, $log, $timeout, $translate,
                gameService, stateService,
                checkersLogicService, checkersAiService,
                resizeGameAreaService, dragAndDropService) {

        'use strict';

        console.log("Translation of 'RULES_OF_TICTACTOE' is " + $translate('RULES_OF_CHECKERS'));

        var CONSTANTS = checkersLogicService.CONSTANTS;
        var gameArea = document.getElementById("gameArea");
        var hasMadeMove = false;

        // Global variables for drag-n-drop and ai move animations
        var dndStartPos = null;
        var dndElem = null;
        var aiMoveDeltas = null;

        var isUndefinedOrNull = function (val) {
          return angular.isUndefined(val) || val === null;
        };

        /**
         * Check if it is a dark cell.
         */
        $scope.isDarkCell = function (row, col) {
          var isEvenRow = row % 2 === 0;
          var isEvenCol = col % 2 === 0;

          return ((!isEvenRow && isEvenCol) || (isEvenRow && !isEvenCol));
        };

        /**
         * Check if there's a piece within the cell.
         */
        $scope.hasPiece = function (row, col) {
          var delta = {row: row, col: col};
          var rotatedDelta = rotate(delta);

          return $scope.isDarkCell(rotatedDelta.row, rotatedDelta.col) &&
              !isUndefinedOrNull($scope.board) &&
              $scope.board[rotatedDelta.row][rotatedDelta.col] !== 'DS';
        };

        /**
         * Get the piece image path
         */
        $scope.getPieceSrc = function (row, col) {
          var delta = {row: row, col: col};
          var rotatedDelta = rotate(delta);
          var dir = 'imgs/';
          var ext = '.png';

          if ($scope.hasPiece(row, col)) {
            switch ($scope.board[rotatedDelta.row][rotatedDelta.col]) {
              case 'BM':
                return dir + 'black_man' + ext;
              case 'BK':
                return dir + 'black_cro' + ext;
              case 'WM':
                return dir + 'white_man' + ext;
              case 'WK':
                return dir + 'white_cro' + ext;
            }
          }

          return dir + 'empty' + ext;
        };

        function handleDragEvent(type, cx, cy) {
          var cellSize = getCellSize();

          // Make sure the player can not drag the piece outside of the board
          var x = Math.min(Math.max(cx - gameArea.offsetLeft, cellSize.width / 2), gameArea.clientWidth - cellSize.width / 2);
          var y = Math.min(Math.max(cy - gameArea.offsetTop, cellSize.height / 2), gameArea.clientHeight - cellSize.height / 2);

          var delta = {
            row: Math.floor(CONSTANTS.ROW * y / gameArea.clientHeight),
            col: Math.floor(CONSTANTS.COLUMN * x / gameArea.clientWidth)
          };
          var rotatedDelta = rotate(delta);

          if (type === "touchstart" && canDrag(delta.row, delta.col) && isUndefinedOrNull(dndStartPos)) {
            // Start to drag a piece
            dndStartPos = angular.copy(delta);

            // If a piece is dragged, store the piece element
            if ($scope.hasPiece(delta.row, delta.col) &&
                $scope.isYourTurn &&
                isOwnColor(rotatedDelta)) {
              dndElem = document.getElementById("img_" + dndStartPos.row + "_" + dndStartPos.col);
            }
          } else if (type === "touchend" && !isUndefinedOrNull(dndStartPos)) {
            // Drop a piece
            var from = {row: dndStartPos.row, col: dndStartPos.col};
            var to = {row: delta.row, col: delta.col};

            makeMove(rotate(from), rotate(to));

            setDndElemPos(getCellPos(dndStartPos.row, dndStartPos.col));

            dndStartPos = null;
            if (!isUndefinedOrNull(dndElem)) {
              dndElem.removeAttribute("style");
              dndElem = null;
            }
          } else if (type === 'touchmove' && !isUndefinedOrNull(dndStartPos)) {
            // Dragging around

            setDndElemPos({
              top: y - cellSize.height * 0.605,
              left: x - cellSize.width * 0.605
            });
          }

          // Clean up
          if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
            dndStartPos = null;
            dndElem = null;
          }
        }

        /**
         * Check if the piece in the delta position has the own color.
         */
        function isOwnColor(delta) {
          return checkersLogicService.isOwnColor($scope.yourPlayerIndex, $scope.board[delta.row][delta.col].substring(0, 1));
        }

        /**
         * Set the position of the element.
         */
        function setDndElemPos(pos) {
          var size = getCellSize();
          var top = size.height / 10;
          var left = size.width / 10;

          var originalSize = getCellPos(dndStartPos.row, dndStartPos.col);
          if (dndElem !== null) {
            dndElem.style.left = (pos.left - originalSize.left + left) + "px";
            dndElem.style.top = (pos.top - originalSize.top + top) + "px";
          }
        }

        /**
         * Get the size of the cell.
         */
        function getCellSize() {
          return {
            width: gameArea.clientWidth / CONSTANTS.COLUMN,
            height: gameArea.clientHeight / CONSTANTS.ROW
          };
        }

        /**
         * Get the position of the cell.
         */
        function getCellPos(row, col) {
          var size = getCellSize();
          return {top: row * size.height, left: col * size.width};
        }

        /**
         * Rotate 180 degrees by simply convert the row and col number for UI.
         */
        function rotate(delta) {
          if ($scope.rotate) {
            // Zero based
            return {
              row: CONSTANTS.ROW - delta.row - 1,
              col: CONSTANTS.COLUMN - delta.col - 1
            };
          }

          return delta;
        }

        /**
         * Check if the piece can be dragged.
         */
        function canDrag(row, col) {
          var delta = {row: row, col: col};
          var rotatedDelta = rotate(delta);

          if (!$scope.hasPiece(row, col) ||
              !isOwnColor(rotatedDelta) ||
              $scope.isAiMove) {
            return false;
          }

          var hasMandatoryJump = checkersLogicService.hasMandatoryJumps($scope.board, $scope.yourPlayerIndex);
          var possibleMoves;

          if (hasMandatoryJump) {
            possibleMoves = checkersLogicService
                .getJumpMoves($scope.board, rotatedDelta, $scope.yourPlayerIndex);
          } else {
            possibleMoves = checkersLogicService
                .getSimpleMoves($scope.board, rotatedDelta, $scope.yourPlayerIndex);
          }

          return possibleMoves.length > 0;
        }

        /**
         * Convert the delta to UI state index
         */
        function toIndex(row, col) {
          return row * CONSTANTS.COLUMN + col;
        }

        /**
         * Add animation class so the animation may be performed accordingly
         *
         * @param callback makeMove function which will be called after the
         *                 animation is completed.
         */
        function playAnimation(fromDelta, toDelta, addClass, cb) {
          var fromIdx = toIndex(fromDelta.row, fromDelta.col);
          var toIdx = toIndex(toDelta.row, toDelta.col);
          var elem = document.getElementById("img_" + fromDelta.row + "_" + fromDelta.col);

          // Add the corresponding animation class
          switch (toIdx - fromIdx) {
            case CONSTANTS.COLUMN + 1:
              // Simple move up left
              processAnimationClass(elem, addClass, 'move_down_right', 'move_up_left');
              break;
            case CONSTANTS.COLUMN - 1:
              // Simple move up right
              processAnimationClass(elem, addClass, 'move_down_left', 'move_up_right');
              break;
            case -CONSTANTS.COLUMN + 1:
              // Simple move down left
              processAnimationClass(elem, addClass, 'move_up_right', 'move_down_left');
              break;
            case -CONSTANTS.COLUMN - 1:
              // Simple move down right
              processAnimationClass(elem, addClass, 'move_up_left', 'move_down_right');
              break;
            case (2 * CONSTANTS.COLUMN) + 2:
              // Jump move up left
              processAnimationClass(elem, addClass, 'jump_down_right', 'jump_up_left');
              break;
            case (2 * CONSTANTS.COLUMN) - 2:
              // Jump move up right
              processAnimationClass(elem, addClass, 'jump_down_left', 'jump_up_right');
              break;
            case -(2 * CONSTANTS.COLUMN) + 2:
              // Jump move down left
              processAnimationClass(elem, addClass, 'jump_up_right', 'jump_down_left');
              break;
            case -(2 * CONSTANTS.COLUMN) - 2:
              // Jump move down right
              processAnimationClass(elem, addClass, 'jump_up_left', 'jump_down_right');
              break;
          }

          if (addClass) {
            elem.addEventListener("animationend", cb, false);
            elem.addEventListener("webkitAnimationEnd", cb, false);
          } else {
            //todo
            elem.removeEventListener("animationend");
            elem.removeEventListener("webkitAnimationEnd");
            cb();
          }


        }

        function processAnimationClass(elem, addClass, normalClassName, rotatedClassName) {
          if (addClass) {
            if ($scope.rotate) {
              elem.className += ' ' + rotatedClassName;
            } else {
              elem.className += ' ' + normalClassName;
            }
          } else {
            elem.className = 'piece';
          }
        }

        /**
         * Make the move by using gameService.
         */
        function makeMove(fromDelta, toDelta) {
          var operations;

          try {
            operations = checkersLogicService.createMove(angular.copy($scope.board),
                fromDelta, toDelta, $scope.yourPlayerIndex);
          } catch (e) {
            return;
          }

          if (!hasMadeMove) {
            hasMadeMove = true;
            gameService.makeMove(operations);
          }
        }

        /**
         * This function use the alpha beta pruning algorithm to calculate a
         * best move for the ai, then play the animation and after the animation
         * ends, make the move.
         */
        function aiMakeMove() {
          var bestMove,
              timeLimit = 1000;

          bestMove = checkersAiService.
              createComputerMove($scope.board, $scope.yourPlayerIndex,
              // 1 seconds for the AI to choose a move
              {millisecondsLimit: timeLimit});

          // Instead of making the move directly, use makeMove function instead.
          var from = bestMove[bestMove.length - 2];
          var to = bestMove[bestMove.length - 1];
          var fromDelta = {
            row: from.set.value.row,
            col: from.set.value.col
          };
          var toDelta = {
            row: to.set.value.row,
            col: to.set.value.col
          };

          aiMoveDeltas = {from: fromDelta, to: toDelta};

          playAnimation(fromDelta, toDelta, true, function () {
            // Make the move after playing the animaiton.
            makeMove(fromDelta, toDelta);
          });
        }

        /**
         * This method update the game's UI.
         * @param params
         */
        function updateUI(params) {
          hasMadeMove = false;

          //Rotate the board 180 degrees, hence in the point of current
          //player's view, the board always face towards him/her;
          if (params.playMode === "playBlack") {
            $scope.rotate = true;
          } else {
            $scope.rotate = false;
          }

          // Get the new state
          $scope.yourPlayerIndex = params.yourPlayerIndex;
          $scope.playersInfo = params.playersInfo;
          $scope.board = params.stateAfterMove.board;

          // White player initialize the game if the board is empty.
          if (isUndefinedOrNull($scope.board) && params.yourPlayerIndex === 0) {
            initial();
            return;
          }

          // It's your move. (For the current browser...)
          $scope.isYourTurn = params.turnIndexAfterMove >= 0 &&
              params.yourPlayerIndex === params.turnIndexAfterMove;

          // You're a human player
          $scope.isPlayerMove = $scope.isYourTurn &&
              params.playersInfo[params.yourPlayerIndex].playerId !== '';

          // You're an AI player
          $scope.isAiMove = $scope.isYourTurn &&
              params.playersInfo[params.yourPlayerIndex].playerId === '';

          if (!isUndefinedOrNull(aiMoveDeltas)) {
            playAnimation(aiMoveDeltas.from, aiMoveDeltas.to, false, function () {
              aiMoveDeltas = null;
            });
          }

          // The game is properly initialized, let's make a move :)
          // But first update the graphics (isAiMove: true)
          if ($scope.isAiMove) {
            $timeout(aiMakeMove, 500);
          }
        }

        /**
         * Send initial move
         */
        var initial = function () {
          try {
            var move = checkersLogicService.getFirstMove();
            gameService.makeMove(move);
          } catch (e) {
            $log.info(e);
            $log.info("initialGame() failed");
          }
        };

        resizeGameAreaService.setWidthToHeight(1);

        dragAndDropService.addDragListener("gameArea", handleDragEvent);

        /**
         * Set the game!
         */
        gameService.setGame({
          gameDeveloperEmail: "yl1949@nyu.edu",
          minNumberOfPlayers: 2,
          maxNumberOfPlayers: 2,
          isMoveOk: checkersLogicService.isMoveOk,
          updateUI: updateUI
        });
      }]);
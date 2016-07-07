var debug = true;
var STUDENT_URL = "https://api-dev.nearpod.com/v1/hub/student/";
/* State
 * -------
 * cards (array): an array of this students bingo cards, in the order that they appear on his/her board.
 * question (string): the current question, or "" if none.
 * myAnswers (dictionary): map of questions to the id of the card that this student answered that question with ("question": cardId)
 * modalType (string): the type of modal to display, or "" if none. Should be set to something before chanign isModalOpen to true.
 * isModalOpen (boolean): whether or not a modal is currently being displayed.
 * selectedCardIndex (int): when a student clicks on a card, this holds the index in |cards| of the card they selected. Default value is -1 (no selection)
 * readyForNextQuestion (boolean): false until the student answers the current question, then becomes true. When a new question arrives, turns to false again unitl they answer.
 * numBingoChecksLeft (int): the number of chances this student has left to check if they have bingo. Starts at 3. 
 * hasBingo (boolean): false until the student gets bingo correctly!
 * indexOfIncorrectCard (int): if there is an incorrect card to display, this variable holds the index (in state.cards) of that card
 * deviceID 
 * bingoWinners (array): list of people who have won bingo (if any), given by the teacher
 * nickname (string): student's nickname
 * position (int): if the student had bingo, holds their position in leader board; otherwise -1
 * responseText (string): empty string until the end of the game, when the teacher sends us what our response text should be (basically a/b correct, c/d incorrect)
 */
var StudentView = React.createClass({
	getUrlVars: function() {
      var vars = {};
      var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
          vars[key] = value;
      });
      return vars;
  	},
  	/* Given a JWT, returns the device UID that corresponds to that JWT. */
  	decodeDeviceUID: function(jwt) {
  		if (jwt) {
  			var firstIndex = jwt.indexOf(".") + 1;
			var firstParse = jwt.substr(firstIndex);

			var secondIndex = firstParse.indexOf(".");
			var secondParse = firstParse.substr(0, firstParse.indexOf("."));

			var decodedJWT = JSON.parse(atob(secondParse));
			var uid = decodedJWT["uid"];
			return uid;
  		} else {
  			return "";
  		}
  	},
  	setHeaders: function(){
    	return {"x-api-key":"7dabac64681a7c12c1cb97183c44de93", "JWT": this.state.jwt};
  	},
	getInitialState: function() {
		var urlVars = this.getUrlVars();
		if (debug) console.log("URL vars: ");
		if (debug) console.log(urlVars);
		if (debug) console.log("JWT: " + urlVars["jwt"]);
		var deviceUID = this.decodeDeviceUID(urlVars["jwt"]);
		if (debug) console.log("Device UID: " + deviceUID);
 		return {
 			deviceUID: deviceUID,
			slideID: urlVars["id"],
      		jwt: urlVars["jwt"],
      		presentationID: urlVars["presentation_id"],
			cards:[], 
			question:"", 
			myAnswers: {},
			modalType:"", 
			isModalOpen: false, 
			selectedCardIndex: -1, 
			readyForNextQuestion: false,
			numBingoChecksLeft: 3,
			hasBingo: false, 
			indexOfIncorrectCard: -1,
			deviceID: 0,
			nickname: "",
			bingoWinners: [],
			position: -1,
			responseText: ""		
		};
	},
	post: function(path, params) {
	    if (debug) console.log("Making POST request with path: " + path);
	    if (debug) console.log("Params: ");
	    if (debug) console.log(params);
	    $.ajax({
	        url: STUDENT_URL + path,
	        method: "POST",
	        async: false,
	        data: JSON.stringify(params),
	        headers: this.setHeaders(),
	        success: function(data, textStatus, jqXHR){
	          if (debug) console.log("Successful post!");
	        },
	        error: function(jqXHR, textStatus, errorThrown){
	          if (debug) console.log("Error posting");
	        }
	    });
  	},
  	loadTeacherResponsesSuccess: function(data, textStatus, jqXHR) {
  		if (debug) console.log("GET teacher resopnses success");
  		if (debug) console.log(data);
		var myDeviceUid = this.state.deviceUID; // TO DO: update to not be hard coded !

		/* If we have bingo and haven't figured out what our position is, get that */
		var myPos = this.state.position;
		if (this.state.hasBingo && (this.state.position == -1)) {
			if (debug) console.log("LEADER BOARD: ");
			if (debug) console.log(data.payload.status.leaderBoard);
			for (var i=0; i < data.payload.status.leaderBoard.length; i++) {
				if (debug) console.log("Looking at: " + data.payload.status.leaderBoard[i]);
				if (debug) console.log("It has device UID: " + data.payload.status.leaderBoard[i].device_uid);
				if (debug) console.log("And I have decive UID: " + this.state.deviceUID);
				if (data.payload.status.leaderBoard[i].device_uid == this.state.deviceUID) {					
					myPos = i + 1;
					if (debug) console.log("So yes, setting pos to: " + myPos);
					break;
				}
			}
		}
		/* UPDATE CARDS */
	    var cards = this.state.cards;
	    var teacherResponseCards = data.payload.status.studentResponses[myDeviceUid].cards;
	    if (cards.length == 0) {
	    	if (debug) console.log("Don't have cards yet, so getting them from response...");
    		cards = teacherResponseCards;
    		if (debug) console.log("Cards: ");
    		if (debug) console.log(cards);
    	} else {
    		/* The cards we have are updated, we just need to see if the teacher approved any
    		   ONLY look at "teacherApproved" field of cards and udpate it then. 
    		   If hasChip but teacherApproved is false, look for correctCardID/questionIncorrectlyAnswered. */
    		for (var i=0; i < teacherResponseCards.length; i++) {
    			var teacherCard = teacherResponseCards[i];
    			if (cards[i].teacherApproved) {
    				/* Special case: when we get a chip incorrect & re-place it, we will have 
    			  	   marked it as true but teacher still might have it as false. Ignore 
    			       teacher. A card should never go from teacherApproved = true to false. */
    				continue; 
    			}
    			cards[i].teacherApproved = teacherCard.teacherApproved;
    			/* If teacher has not set correct card ID, it's -1 */
    			if (teacherCard.correctCardID >= 0) {
    				cards[i].correctCardID = teacherCard.correctCardID;
    				cards[i].questionIncorrectlyAnswered = teacherCard.questionIncorrectlyAnswered;
    			}
    		}
    	}
    	/* UPDATE NEXT QUESTION (see if it's time for next question) */
    	var readyForNext = this.state.readyForNextQuestion;
    	var nextQuestion = data.payload.status.nextQuestion;
    	if (nextQuestion != this.state.question) {
    		readyForNext = false;
    	}
    	if (debug) console.log ("Updating my cards to...");
    	if (debug) console.log(cards);
    	/* Update state */
    	if (debug) console.log("Setting position to: " + myPos);
	    this.setState({
	      	question: nextQuestion, 
	      	cards: cards,
	      	readyForNextQuestion: readyForNext,
	      	position: myPos
	    });

	    /* CHECK IF GAME IS OVER */
	    var leaderNicknames = [];
	    for (var i=0; i < data.payload.status.leaderBoard.length; i++) {
	    	var cur = data.payload.status.leaderBoard[i];
	    	leaderNicknames.push(cur.nickname);
	    }
	    if (data.payload.status.gameOver) {
	    	if (debug) console.log("GAME OVER! Setting response text...");
	    	if (debug) console.log(data.payload.status.leaderBoard);
	    	var reportsStr = data.payload.status.reportsText[this.state.deviceUID];
	    	if (debug) console.log("Response text is: " + reportsStr);
	    	this.setState({
	    		responseText: reportsStr, 
	    		modalType: "gameOver",
	    		isModalOpen: true,
	    		bingoWinners: data.payload.status.leaderBoard
	    	})
	    	var dictionaryToPost = this.getDictionaryToPost();
	    	/* POST one last time */
	    	var params = {
	            "response": dictionaryToPost,
	            "response_text": reportsStr
	        };
	        this.post("responses", params);	
	    }
  	},
  	/* Called when the GET request to load this student's prior responses to this 
  	   game succeeded. If there is a response, then reload that game. Otherwise
  	   it's just a new game. 

  	   Either way, get the student's nickname here from the response. 

  	   Start polling for teacher responses here.
  	 */
  	loadPriorStudentResponseSuccess: function(data, textStatus, jqXHR) {
  		if (debug) console.log("LOAD PRIOR STUDENT RESPONSE SUCCESS!");
  		if (debug) console.log(data);
  		/* Get the nickname */
  		var nickname = data.payload.nickname;
  		if (debug) console.log("SETTING NICKNAME TO: " + nickname);
  		/* See if there's a response */
  		if (data.payload.response) {
  			if (debug) console.log("ALREADY HAS A RESPONSE...");
  			this.setState({
  				cards: data.payload.response.cards,
  				numBingoChecksLeft: data.payload.response.numBingoChecksLeft,
  				hasBingo: data.payload.hasBingo,
  				nickname: nickname
  			});
  		} else {
  			if (debug) console.log("NO RESPONSE YET, PROCEED...");
  			this.setState({
  				nickname: nickname
  			});
  		}

  		/* Poll for teacher response every X seconds */
    	setInterval(this.loadTeacherResponses, this.props.pollInterval);
	},
  	/* GET request (only performed if game is not over)
   	 * --------------------------------------------------
   	 * isContentTool (boolean): true if you are making a GET request to content tool, false otherwise
   	 * urlStr (string): the entire URL string (e.g. "https://api-dev.nearpod.com/v1/ct/custom_slides/1") 
     * params: (probably empty string for GET request)
     * successCallback (function): function that gets called when the GET request succeeds. Passed the data, textStatus, and jqXHR
     */
  	get: function(path, params, successCallback) {
      	if (debug) console.log("Making GET request with path: " + path);
		$.ajax({
		    url: path,
		    method: "GET",
		    async: false,
		    data: params,
		    headers: this.setHeaders(),
		    success: function(data, textStatus, jqXHR){                 
		    	successCallback(data, textStatus, jqXHR);
		    },
		    error: function(jqXHR, textStatus, errorThrown){
		    	if (debug) console.log("ERROR!");
		    }
		});
  	},
  	/* Returns a dictionary that the student should post at the given moment. 
   	* ----------------------------------------------------------------------
   	* The dictionary contains:
   	* 
   	*        key                     value
   	*        ----                    ------
   	*        "deviceID"      		(deviceID): the student's device ID
	*        "cards"          		(Array): the student's cards
   	* 		 "question"				(string): the question the student is answering
   	* 		 "answer"				(string): the word that the student placed a chip to answer |question|, or "" if pass
   	* 		 "didPass"				(boolean): true if the student clicked "Pass" for |question|
   	* 		 "hasBingo" 			(boolean): true when the student has Bingo (& is on the leaderboard), false otherwise
   	*/
  	getDictionaryToPost: function(answer, didPass) {
    	var toPost = {};
    	toPost["cards"] = this.state.cards;
    	toPost["question"] = this.state.question;
    	toPost["answer"] = answer;
    	toPost["didPass"] = didPass;
    	toPost["hasBingo"] = this.state.hasBingo;
    	toPost["numBingoChecksLeft"] = this.state.numBingoChecksLeft;
    	if (debug) console.log("Posting dictionary: ");
    	if (debug) console.log(toPost);
    	return toPost;
  	},
	/* 
	 * Returns true if the given row has a chip on every spot, 
	 * and false if any chips are missing.
	 */
	rowHasBingo: function(row) {
		var numPerRow = Math.sqrt(this.state.cards.length + 1);
		var wildCardRow = Math.floor(numPerRow/2);
		/* Account for row with wild card (has one less real card) */
		var numCardsInRow = numPerRow;
		if (row == wildCardRow) {
			numCardsInRow--; 
		}
		var currRowHasBingo = true;
		for (var col=0; col<numCardsInRow; col++) {
			var currIndex = row * numPerRow + col;
			if (row > wildCardRow) {
				currIndex--;
			}
			/* Skipped wild card */
			var currentCard = this.state.cards[currIndex];
			if (!currentCard["hasChip"]) {
				return false;
			}
		}
		if (currRowHasBingo) return true;
	},
	/* 
	 * Returns true if the given col has a chip on every spot, 
	 * and false if any chips are missing.
	 */
	colHasBingo: function(col) {
		var numPerRow = Math.sqrt(this.state.cards.length + 1);
		var currColHasBingo = true; 
		var wildCardIndex = Math.floor(this.state.cards.length/2);
		for (var row=0; row<numPerRow; row++) {
			/* Check col i */
			var currIndex = col + (row*numPerRow);
			if (currIndex == wildCardIndex) {
				continue;
			} else if (currIndex > wildCardIndex) {
				currIndex--;
			}
			var currentCard = this.state.cards[currIndex];
			if (!currentCard["hasChip"]) {
				currColHasBingo = false;
				break;
			}
		}
		if (currColHasBingo) return true;
	},
    /* 
	 * Returns true if the diagonal from top left to bottom right has a chip 
	 * on every spot, and false if it's missing any.
	 */
	downDiagonalHasBingo: function() {
	    var numPerRow = Math.sqrt(this.state.cards.length + 1);		
	    var wildCardIndex = Math.floor(this.state.cards.length/2);
	    var downDiagonalHasBingo = true;
		for (var i=0; i<numPerRow; i++) {
			var currIndex = i + (i * numPerRow);
			if (currIndex > wildCardIndex) currIndex--;
			if (currIndex == wildCardIndex) continue;
			var currentCard = this.state.cards[currIndex];
			if (!currentCard["hasChip"]) {
				downDiagonalHasBingo = false;
				break;
			}
		}
		if (downDiagonalHasBingo) return true;
	},
	/* 
	 * Returns true if the diagonal from top right to bottom left has a chip 
	 * on every spot, and false if it's missing any.
	 */
	upDiagonalHasBingo: function() {
		var numPerRow = Math.sqrt(this.state.cards.length + 1);		
	    var wildCardIndex = Math.floor(this.state.cards.length/2);
		var upDiagonalHasBingo = true;
		for (var i=(numPerRow-1); i>=0; i--) {
			var currRow = (numPerRow-1) - i;
			var currIndex = (currRow * numPerRow) + i;
			if (currIndex > wildCardIndex) currIndex--;
			if (currIndex == wildCardIndex) continue;
			var currentCard = this.state.cards[currIndex];
			if (!currentCard["hasChip"]) {
				upDiagonalHasBingo = false;
				break;
			}
		}
		if (upDiagonalHasBingo) return true;
	},
	/* Returns true if the student currently has bingo (based on where 
	   their chips are placed, and not whether the chips were placed 
	   correctly), and false if bingo is not possible with current chip 
	   layout */
	bingoButtonShouldActivate: function() {
		/* If we are waiting for the next question, return false b/c we need to wait for a teacher 
		   response */
		if (this.state.readyForNextQuestion) return false; 
		/* If we already got bingo, disable it */
		if (this.state.hasBingo) {
			if (debug) console.log("ALREADY GOT BINGO!!");
			return false;
		}
		/* If we are out of bingo checks, return false */
		if (this.state.numBingoChecksLeft <= 0) return false; 
		if (debug) console.log("HERE");
		if (debug) console.log(this.state.hasBingo);
		var numPerRow = Math.sqrt(this.state.cards.length + 1);
		var wildCardRow = Math.floor(numPerRow/2);
		var wildCardIndex = Math.floor(this.state.cards.length/2);
		/* Check horizontal */
		for (var row=0; row<numPerRow; row++) {
			/* Account for row with wild card (has one less real card) */
			if (this.rowHasBingo(row)) {
				return true;
			}
		}
		/* Check vertical */
		for (var col=0; col<numPerRow; col++) {
			if (this.colHasBingo(col)) {
				return true;
			}
		}
		/* Check diagonal from top left to bottom right corners */
		if (this.downDiagonalHasBingo()) return true;
		/* Check diagonal from top right to bottom left corners */
		if (this.upDiagonalHasBingo()) return true; 

		return false;
	},
	/* Called when they place a chip on a card */
	handleClickedCard: function(cardIndex) {
		this.state.selectedCardIndex = cardIndex;
		this.openModal("confirmChipPlacement");
	},
	/*
   	 * Makes a GET request to the API to get the teacher's response. 
   	 */
	loadTeacherResponses: function() {
		this.get(STUDENT_URL + "custom_status", "", this.loadTeacherResponsesSuccess);
	},
  	componentDidMount: function() {
  		/* First see if student is in middle of game (e.g. reloaded page) */
  		this.get(STUDENT_URL + "responses", "", this.loadPriorStudentResponseSuccess); 	
  	},
  	/* The app uses one shared modal, so we open & close it as needed and just change its inner content.
  	 * modalType (string): the type of modal you want to open
  	 */
  	openModal: function(modalType) {
        this.setState({modalType: modalType, isModalOpen: true});
    },
    /* Pre-condition: The students' chips make at least 1 valid Bingo formation. 
     * This method checks to see if all the chips in at least 1 of the student's Bingo 
     * rows were correctly placed. If all of the Bingo rows have at least one mistake, then 
     * this method will return the index in this.state.cards where an incorrect card is.
     * if there were no mistakes, then returns -1.
     */
    hasIncorrectAnswer: function() {
    	/* TO DO: If a card has a Chip, teacherApproved is false, but there's no correct card ID, 
    	   then we need to wait for the teacher to respond. */
    	var incorrectIndex = -1;
    	var numPerRow = Math.sqrt(this.state.cards.length + 1);
		var wildCardRow = Math.floor(numPerRow/2);
		var wildCardIndex = Math.floor(this.state.cards.length/2);
		/* CHECK HORIZONTAL 
    	 * ----------------- */
		for (var row=0; row<numPerRow; row++) {
			/* See if there are chips on every card in this row */
			var currRowHasBingo = this.rowHasBingo(row);
			if (currRowHasBingo) {
				/* If so, check if all chips in row were CORRECTLY placed */
				var numCardsInRow = numPerRow;
				if (row == wildCardRow) {
					numCardsInRow--; 
				}
				for (var i=0; i<numCardsInRow; i++) {
					/* Get current card */
					var currIndex = row * numPerRow + i;
					if (row > wildCardRow) {
						currIndex--;
					}
					/* Check if chip was incorrectly placed on this card */
					var curCard = this.state.cards[currIndex];
					if (!curCard.teacherApproved) {
						incorrectIndex = currIndex;
						currRowHasBingo = false; /* Sorry, not actually bingo! */
					}
				}
			} 
			/* If all the chips were correctly placed, then currRowHasBingo will still be true! */
			if (currRowHasBingo) return -1; /* Successful bingo! */
		}

	    /* CHECK VERTICAL 
    	 * ----------------- */
    	for (var col=0; col<numPerRow; col++) {
			/* See if there are chips on every card in this row */
			var currColHasBingo = this.colHasBingo(col);
			if (currColHasBingo) {
				/* If so, check if all chips in row were CORRECTLY placed */
				for (var i=0; i<numPerRow; i++) {
					/* Get current card */
					var currIndex = col + (i*numPerRow);
					if (currIndex == wildCardIndex) {
						continue;
					} else if (currIndex > wildCardIndex) {
						currIndex--;
					}
					/* Check if chip was incorrectly placed on this card */
					var curCard = this.state.cards[currIndex];
					if (!curCard.teacherApproved) {
						incorrectIndex = currIndex;
						currColHasBingo = false; /* Sorry, not actually bingo! */
					}
				}
			} 
			/* If all the chips were correctly placed, then currRowHasBingo will still be true! */
			if (currColHasBingo) return -1; /* Successful bingo! */
		}

		/* CHECK UP DIAGONAL
		 * ------------------ */
		 var diagonalHasBingo = true;
		 if (this.upDiagonalHasBingo()) {
		 	var numPerRow = Math.sqrt(this.state.cards.length + 1);		
	    	var wildCardIndex = Math.floor(this.state.cards.length/2);
			var upDiagonalHasBingo = true;
			for (var i=(numPerRow-1); i>=0; i--) {
				var currRow = (numPerRow-1) - i;
				var currIndex = (currRow * numPerRow) + i;
				if (currIndex > wildCardIndex) currIndex--;
				if (currIndex == wildCardIndex) continue;
				var curCard = this.state.cards[currIndex];
				if (!curCard.teacherApproved) {
					incorrectIndex = currIndex;
					diagonalHasBingo = false; /* Sorry, not actually bingo! */
				}
			}
			if (diagonalHasBingo) return -1;
		 }

		 /* CHECK DOWN DIAGONAL
		  * -------------------- */
		 var upDiagonalHasBingo = true;
		 if (this.downDiagonalHasBingo()) {
		 	var numPerRow = Math.sqrt(this.state.cards.length + 1);		
	   	 	var wildCardIndex = Math.floor(this.state.cards.length/2);
	    	var downDiagonalHasBingo = true;
			for (var i=0; i<numPerRow; i++) {
				var currIndex = i + (i * numPerRow);
				if (currIndex > wildCardIndex) currIndex--;
				if (currIndex == wildCardIndex) continue;
				var curCard = this.state.cards[currIndex];
				if (!curCard.teacherApproved) {
					incorrectIndex = currIndex;
					upDiagonalHasBingo = false; /* Sorry, not actually bingo! */
				}
			}
			if (upDiagonalHasBingo) return -1;
		 }
    	/* If you get here, then they didn't have any successful bingos. */
    	return incorrectIndex;
    },
    /* Called when the user clicks "yes" to close the modal. Check what the curent modal type is and act accordingly.
     * "confirmChipPlacement": place a chip on the card they selected, and update our map of questions --> my answers 
     * "checkBingo": check if they have bingo
     * "skip": don't place any chips, just become ready for next question
     * "incorrect": place a chip on the correct answer (after getting one wrong), and set correctCardIndex to -1
     */
    closeModalAccept: function() {
    	switch(this.state.modalType) {
    		case "confirmChipPlacement":
        		/* Place the chip */
    			var cards = this.state.cards;
				cards[this.state.selectedCardIndex]["hasChip"] = true;
				/* Mark it as answer in our map of questions --> our answers */
				this.state.myAnswers[this.state.question] = cards[this.state.selectedCardIndex].id;
				this.bingoButtonShouldActivate();
        		this.setState({cards: cards, isModalOpen: false, modalType:"", selectedCardIndex: -1, readyForNextQuestion: true});
        		/* POST student resopnse */
        		var dictionaryToPost = this.getDictionaryToPost(cards[this.state.selectedCardIndex].answer, false);
        	 	if (debug) console.log("Posting dictionary: ");
        	 	if (debug) console.log(dictionaryToPost);
        	 	var params = {
              		"response": dictionaryToPost,
              		"response_text": this.state.responseText
           	 	};
        		this.post("responses", params);
       			break;
    		case "checkBingo":
    			var numBoardChecksLeft = this.state.numBingoChecksLeft - 1;
    			/* Check if they have bingo */
    			var incorrectCardIndex = this.hasIncorrectAnswer();
    			if (incorrectCardIndex == -1) {
    				/* They have bingo!! */
    				this.setState({hasBingo: true, numBingoChecksLeft: numBoardChecksLeft, isModalOpen: false, modalType:"", readyForNextQuestion: false});
    				this.openModal("youGotBingo");
    				/* POST student resopnse */    					        	 	
    				var dictionaryToPost = {};
			    	dictionaryToPost["cards"] = this.state.cards;
			    	dictionaryToPost["question"] = "";
			    	dictionaryToPost["answer"] = "";
			    	dictionaryToPost["didPass"] = false;
			    	dictionaryToPost["hasBingo"] = true;
			    	dictionaryToPost["numBingoChecksLeft"] = this.state.numBingoChecksLeft;
	        	 	var params = {
	              		"response": dictionaryToPost,
	              		"response_text": this.state.responseText
	           	 	};
	        		this.post("responses", params);				
    			} else {
    				/* They don't have Bingo. */
    				/* Get the IDs of the incorrect and correct card */
    				/* TO DO: if "correctCardId" and "questionIncorrectlyAnswered" are not
    				   yet filled out for the unapproved card, then keep waiting for a teacher
    				   response... */
    				this.setState({
    					hasBingo: false, 
    					numBingoChecksLeft: numBoardChecksLeft, 
    					isModalOpen: false, modalType:"", 
    					indexOfIncorrectCard: incorrectCardIndex });
    				this.openModal("incorrect");
    			}
        		break;
        	case "skip":
        		/* Ready for next question */
        		this.setState({isModalOpen: false, modalType:"", selectedCardIndex: -1, readyForNextQuestion: true});
    			/* POST student resopnse */
    			var dictionaryToPost = this.getDictionaryToPost("", true);
	        	if (debug) console.log("Posting dictionary: ");
	        	if (debug) console.log(dictionaryToPost);
	        	var params = {
	              	"response": dictionaryToPost,
	              	"response_text": this.state.responseText
	           	};
	        	this.post("responses", params);	
        		break;
        	case "incorrect":
        		var cards = this.state.cards;
        		var incorrectCard = this.state.cards[this.state.indexOfIncorrectCard];
        		var correctCardIndex = this.getCardIndexFromId(incorrectCard.correctCardID);
        		cards[this.state.indexOfIncorrectCard].hasChip = false;
        		cards[this.state.indexOfIncorrectCard].correctCardID = -1;
        		cards[this.state.indexOfIncorrectCard].questionIncorrectlyAnswered = "";
        		cards[correctCardIndex].hasChip = true;
        		/* Set the card as teacher approved, clear other fields associated w/ being incorrect */
        		cards[correctCardIndex].teacherApproved = true;
        		cards[correctCardIndex].correctCardID = -1;
        		cards[correctCardIndex].questionIncorrectlyAnswered = "";
        		if (this.state.numBingoChecksLeft <= 0) {
        			this.setState({cards: cards, modalType:"", indexOfIncorrectCard: -1});
        			this.openModal("outOfChecks");
        		} else {
        			this.setState({isModalOpen: false, cards: cards, modalType:"", indexOfIncorrectCard: -1});
        		}
        		break;
    		default:
    			/* Close modal */
    			this.setState({isModalOpen: false, modalType:"", selectedCardIndex: -1});
        		break;
		}
    },
    /* Called when the user clicks "yes" to close the modal. Check what the curent modal type is and act accordingly.
     * "confirmChipPlacement": close modal
     * "checkBingo": close modal
     * "skip": close modal 
     * "youGotBingo": close modal
     */
    closeModalCancel: function() {
    	switch(this.state.modalType) {
    		case "confirmChipPlacement":
        		/* Close modal */
    			this.setState({isModalOpen: false, modalType:"", selectedCardIndex: -1});
       			break;
    		case "checkBingo":
    			/* Close modal */
    			this.setState({isModalOpen: false, modalType:""});
        		break;
        	case "skip":
        		this.setState({isModalOpen: false, modalType:"", selectedCardIndex: -1});
        		break;
        	case "youGotBingo":
        		this.setState({isModalOpen: false, modalType:""});
        		break;
    		default:
    			/* Close modal */
    			this.setState({isModalOpen: false, modalType:"", selectedCardIndex: -1});
        		break;
		}
    },
    /* Called when the student clicks the "I have bingo" button*/
    handleBingoClicked: function() {
    	this.openModal("checkBingo");
    },
    /* Called when the student clicks "Skip" */
    handleSkipQuestion: function() {
    	this.openModal("skip");
    },
    /* Given the ID of a card, returns the index of that card on this student's board, or -1 if it's not on the board. */
    getCardIndexFromId: function(cardId) {
    	for (var i=0; i < this.state.cards.length; i++) {
    		var currCard = this.state.cards[i];
    		if (currCard.id == cardId) return i;
    	}
    	return -1; 
    },
    getQuestionAnsweredWithId: function(answerCardId) {
    	for (var key in this.state.myAnswers) {
    		var cardId = this.state.myAnswers[key];
    		if (cardId == answerCardId) {
    			return key;
    		}
    	}
    	return "";
    },
  	render: function() {
  		var hasBingo = this.bingoButtonShouldActivate();
  		/* Message to display below "I have Bingo!" button */
  		var message = "Board checks left: " + this.state.numBingoChecksLeft;
  		var bingoWinnerNicknames = [];
  		if (this.state.hasBingo) {
  			message = "You got ";
  			if (this.state.position == -1) message = "You got Bingo!";
  			else if (this.state.position == 1) message += " 1st place!";
  			else if (this.state.position == 2) message += "2nd place!";
  			else if (this.state.position == 3) message += "3rd place!";
  			else {
  				message += this.state.position;
  				message += "th place";
  			}

  			/* Create array of JUST nicknames (not device UIDs) of winners */
  			for (var i=0; i < this.state.bingoWinners.length; i++) {
  				var cur = this.state.bingoWinners[i];
  				bingoWinnerNicknames.push(cur["nickname"]);
  			}
  		}
  		var question = this.state.question;
  		/* If the user just selected a card, figure out what the word was so we
  		   can display it in modal */
  		var selectedCardWord = "";
  		if (this.state.selectedCardIndex != -1) {
  			selectedCardWord = this.state.cards[this.state.selectedCardIndex].answer;
  		}
  		/* If the student is currently waiting for the next question, then don't respond
  		   to any clicks on cards */
  		var canSelectCard = !this.state.readyForNextQuestion;

  		/* Only display a card as incorrect if they decided that they wanted to check bingo (i.e., we are currently displaying the incorrect modal)
  		 * Otherwise keep it hidden for now (by setting incorrect index to -1). */
  		var incorrectCardIndex = this.state.indexOfIncorrectCard;
  		var incorrectCard = {};
  		var incorrectAnswer = "";
  		var correctAnswer = "";
  		var correctCardIndex = -1;
  		var incorrectlyAnsweredQuestion = "";
  		if (incorrectCardIndex != -1) {
  			incorrectCard = this.state.cards[incorrectCardIndex];
  			incorrectAnswer = incorrectCard.answer;
  			correctCardIndex = this.getCardIndexFromId(incorrectCard.correctCardID);
  			incorrectlyAnsweredQuestion = incorrectCard.questionIncorrectlyAnswered;
  			correctAnswer = this.state.cards[correctCardIndex].answer;
  		}
  		/* If they happen to have incorrectly put a chip on the "correct" answer, change message */
  		var incorrectButtonMessage = "Place chip on '" + correctAnswer + "'";
  		if ((correctCardIndex != -1) && (this.state.cards[correctCardIndex].hasChip)) {
  			incorrectButtonMessage = "Continue";
  		}
  		if (this.state.modalType == "incorrect") {
  			/* The question is the one they were trying to answer but got incorrect */
  			question = this.state.cards[incorrectCardIndex].questionIncorrectlyAnswered;
  		}
		return (
			<div className="studentView ">
				<Header/>
				<div className="studentContent"> 
					<div className="leftBar">
						<Question question={this.state.question} readyForNextQuestion={this.state.readyForNextQuestion} onSkip={this.handleSkipQuestion}/>
						<BingoChecker hasBingo={hasBingo} onBingoClicked={this.handleBingoClicked} numBingoChecksLeft={this.state.numBingoChecksLeft} gotBingo={this.state.hasBingo} message={message}/>
					</div>
					<BingoBoard cards={this.state.cards} handleClickedCard={this.handleClickedCard} clicksEnabled={canSelectCard} incorrectCardIndex={incorrectCardIndex}/>
				</div>				
				<Modal 
					modalType={this.state.modalType} 
					isOpen={this.state.isModalOpen} 
					question={question} 
					answer={selectedCardWord} 
					onAccept={this.closeModalAccept} 
					onCancel={this.closeModalCancel} 
					numBingoChecksLeft={this.state.numBingoChecksLeft} 
					incorrectAnswer={incorrectAnswer} 
					correctAnswer={correctAnswer}
					incorrectButtonMessage={incorrectButtonMessage}
					bingoWinners={bingoWinnerNicknames} />
			</div>
		);
	}
});

var Header = React.createClass ({
	render: function() {
		return (
			<div className="header">
				Bingo
			</div>
		);
	}
});

/*
 * Props
 * -----
 * question (string): the question to display, or "" if none
 * readyForNextQuestion (bool): if true, then we won't display a question, just a "waiting for next question" text
 * onSkip (function): function that gets called when student clicks "skip"
 */
var Question = React.createClass({
	render: function() {
		if (this.props.question && !this.props.readyForNextQuestion) {
			var question = this.props.question;
			var questionClass = "questionCard";
			if (debug) console.log("Question length: " + question.length);
			if (question.length < 27) {
				if (debug) console.log("Question is short, so making it bigger...");
				/* Make the font bigger and centered if the question isn't long */
				questionClass = "questionCard questionCardLarge";
			}
			return (
				<div className="questionBox">
					Question:
					<div className={questionClass} id="questionCardId">
						<div className="verticallyCenteredText">{this.props.question}</div>
					</div>
					<div className="button outlineButton" id="skipButton" onClick={this.props.onSkip}>
						Skip
					</div>
				</div>
			);
		} else {
			return (
				<div className="questionBox">
					<div className="verticallyCenteredText" id="noQuestion">
						Waiting for next question...
					</div>
				</div>
			);
		}
	}
});

/*
 * Props
 * -----
 * hasBingo (boolean): if true, then the "I have bingo" button will activate (should happen when the board currently looks like the student has bingo, regardless of whether their answers were correct)
 * onBingoClicked (function): this function gets called when the student clicks "I have bingo!"
 * gotBingo (boolean): if true, the student already got bingo correctly and all buttons in this section are disabled
 * message (string): message to display below button 
 */
var BingoChecker = React.createClass ({
	render: function() {
		if (this.props.gotBingo) {
			return (
				<div className="bingoChecker">
    				<div className="button grayButtonInactive">
						I have bingo!
					</div><br/>
					{this.props.message}
				</div>
			);
		} else if (this.props.hasBingo) {
			return (
				<div className="bingoChecker">
	    			<div className="button blueButton" id="checkBingoButton" onClick={this.props.onBingoClicked}>
						I have bingo!
					</div><br/>
					{this.props.message}
				</div>
			);
		} else {
			return (
				<div className="bingoChecker">
    				<div className="button grayButtonInactive">
						I have bingo!
					</div><br/>
					{this.props.message}
				</div>
			);
		}
	}
});

/*
 * Props
 * -----
 * clicksEnabled (boolean): if true, then we will respond to parent with click events; if false, we do nothing on clikcs
 * cards (array): array of cards to display on the board
 * handleClickedCard (function): callback that gets called when a BingoCard is selected
 * incorrectCardIndex (int): if there is an "incorrect card" to display (after the student checks for bingo), then this holds the index of that card. Otherwise it's -1.
 */
var BingoBoard = React.createClass ({
	handleClickedCard: function(cardIndex) {
		/* Clicks are disabled when there is no question */
		if (this.props.clicksEnabled) {	
			this.props.handleClickedCard(cardIndex);
		}
	},
	render: function() {
		var bingoCards = []; // will become array of bingo card components
		/* add a bingo card component for every card with a word */
		for (var i=0; i < this.props.cards.length; i++) {
			var card = this.props.cards[i];
			var word = card.answer;
			if (i==Math.floor(this.props.cards.length/2)) {
				/* Add Bingo wild card */
				bingoCards.push(<BingoCard isWild={true} isIncorrect={false} word=""/>);
			}
			/* Add card for whatever's at index i regardless of whether we needed to add wild card */
			var isIncorrect = false;
			if (i==this.props.incorrectCardIndex) {
				isIncorrect = true;
			} 
			bingoCards.push(<BingoCard index={i} isWild={false} isIncorrect={isIncorrect} word={word} hasChip={card["hasChip"]} handleClick={this.handleClickedCard}/>);
		}		
		return (
			<div className="bingoBoard">
				{bingoCards}
			</div>
		);
	}
});

/*
 * Props
 * -----
 * hasChip (boolean): if true, then places a chip on this card
 * isIncorrect (boolean): true if the current card is being displayed as an "incorrect" card after a student has checked for bingo
 * word (string): the word to display on this card
 * index (int): this card's index on the board (from top left to bottom right, excluding wild card)
 * handleClick (function): callback that gets called when this card is selected
 */
var BingoCard = React.createClass ({
	handleClick: function() {
		/* If card already has a chip, do nothing */
		if (!this.props.hasChip) {
			this.props.handleClick(this.props.index);
		}		
	},
	render: function() {
		if (this.props.isWild) {
			return (
				<div className="bingoCard" onClick={this.handleClick}>
					<div className="verticallyCenteredText"><img src="assets/nearpodIcon.png" width="43" height="36" className="wildCardImage"/></div>
				</div>
			);
		} else if (this.props.isIncorrect) {
			return (
				<div className="bingoCard bingoCardIncorrect" onClick={this.handleClick}>
					<div className="verticallyCenteredText"> {this.props.word} </div>
				</div>
			);
		} else  {
			var chipClassName = "bingoCard";
			if (this.props.hasChip) chipClassName += " bingoChipCard";
			return (
				<div className={chipClassName} onClick={this.handleClick}>
					<div className="verticallyCenteredText"> {this.props.word} </div>
				</div>
			); 
		}
	}
});

/* Modal types 
 * -------------
 * "confirmChipPlacement": "Are you sure you want to place this chip" + question and selected answer + yes/no buttons 
 * "checkBingo": "Are you sure you sure you want to check your board for bingo?" + yes/no button
 * "skip": "Are you sure you want to skip" + question + yes/no buttons 
 * "youGotBingo": "You just got bingo" + list of people who got bingo + keep playing button
 * "incorrect": When they check Bingo but had an incorrect answer, shows them that incorrect answer + lets them place chip on correct answer
 * "gameOver": When the game is over. A modal with no buttons.
 *
 * Props
 * -----
 * isOpen (boolean): if true, then displays the modal; otherwise doesn't
 * modalType (string): the type of modal (see above)
 * question (string): 
 * 		- if modal type = "confirmChipPlacement" --> the question the student is trying to answer
 * 		- if modal type = "incorrectAnswer" --> the question they got incorrect
 * answer (string): if the modal is type "confirmChipPlacement", then this prop is the card the student just selected
 * numBingoChecksLeft (int): the the number of bingo checks they have left 
 * incorrectAnswer (string): if modal type = "incorrectAnswer" this is the answer that they selected incorrectly
 * correctAnswer (string): if modal type = "incorrectAnswer" this is the correct answer  
 * onCancel (function): the callback for when student clicks "cancel" button (regardless of modal type)
 * onAccept (function): the callback for when student clicks "yes" button (regardless of modal type)
 * incorrectButtonMessage (string): the message to display on the button when showing the student they got a card incorrect
 * bingoWinners (array): if the game is over, we display a list of winners
 */
var Modal = React.createClass({
    render: function() {
        if(this.props.isOpen){
        	if (this.props.modalType == "confirmChipPlacement") {
        		var question = this.props.question;
        		var questionClass = "questionSmall";
        		if (question.length < 27) {
        			questionClass = "questionSmall questionShort";
        		}
        		return (
	                <div className="modalBg">
	                  <div className="modal">
	              			Are you sure you want to place this chip?<br/>
	              			<div id="questionAnswerContainer">
	              				<div className={questionClass}><div className="verticallyCenteredText">{this.props.question}</div></div>
	              				<div className="answerSmall"><div className="verticallyCenteredText">{this.props.answer}</div></div>
	              			</div>
	              			<div className="modalFooter">
	              				<div id="twoButtonContainer">
									<div className="modalButton outlineButton" id="leftModalButton" onClick={this.props.onCancel}>No, go back.</div>
									<div className="modalButton blueButton" id="rightModalButton" onClick={this.props.onAccept}>Yes, make selection.</div>
								</div>
							</div>
	              		</div>
	                </div>
            	);
        	} else if (this.props.modalType == "skip") {
        		var question = this.props.question;
        		var questionClass = "questionSmall";
        		if (question.length < 27) {
        			questionClass = "questionSmall questionShort";
        		}
        		return (
	                <div className="modalBg">
	                  <div className="modal">
	              			Are you sure you want to skip?<br/>
	              			<div id="questionOnlyContainer">
	              				<div className={questionClass}><div className="verticallyCenteredText">{this.props.question}</div></div>
	              			</div>
	              			<div className="modalFooter">
	              				<div id="twoButtonContainer">
									<div className="modalButton outlineButton" id="leftModalButton" onClick={this.props.onCancel}>No, go back.</div>
									<div className="modalButton blueButton" id="rightModalButton" onClick={this.props.onAccept}>Yes, skip.</div>
								</div>
							</div>
	              		</div>
	                </div>
            	);
        	} else if (this.props.modalType == "checkBingo"){
        		return (
        			<div className="modalBg">
        				<div className="modal">
        					<div className="modalSubheader" id="modalConfirmation">
        						Are you sure you want to check <b>bingo?</b> <br/>
        					</div>
        					<div className="modalHeader">
        						You can only check your board <b>{this.props.numBingoChecksLeft}</b> more times this game.
        					</div>
        					<div className="modalFooter">
	              				<div id="twoButtonContainer">
									<div className="modalButton outlineButton" id="leftModalButton" onClick={this.props.onCancel}>No, go back.</div>
									<div className="modalButton blueButton" id="rightModalButton" onClick={this.props.onAccept}>Yes, I want to check.</div>
								</div>
							</div>
        				</div>
        			</div>
        		);
        	} else if (this.props.modalType == "youGotBingo") {
        		return (
        			<div className="modalBg">
        				<div className="modal">
        					<div className="modalSubheader" id="modalConfirmation">
        						You just got bingo! <br/>
        					</div>
        					<div className="modalHeader">
        						YAY
        					</div>
        					<div className="modalFooter">
        						<div id="singleButtonContainer">
									<div className="modalButton blueButton" id="rightModalButton" onClick={this.props.onCancel}>Keep playing!</div>
								</div>
							</div>
        				</div>
        			</div>
        		);
        	} else if (this.props.modalType == "incorrect") {
        		return (
        			<div className="modalBg">
        				<div className="incorrectModal">
							<span className="incorrectHeader">Uh oh!</span><br/><br/>
		        			<span className="incorrectHeader">Question:</span> {this.props.question} <br/><br/>
		        			<span className="incorrectHeader">You said:</span> {this.props.incorrectAnswer}<br/><br/>
		        			<span className="incorrectHeader">Correct answer:</span> {this.props.correctAnswer}<br/><br/>
        					<div className="button transparentOutlineButton" id="placeCorrectChip" onClick={this.props.onAccept}> {this.props.incorrectButtonMessage}</div>
        				</div>
        			</div>
        		);
        	} else if (this.props.modalType == "gameOver") {
        		if (debug) console.log("Bingo winners: ");
        		if (debug) console.log(this.props.bingoWinners);
        		var winnersStr = "None"
        		if (this.props.bingoWinners.length > 0) {
        			winnersStr = this.props.bingoWinners[0];
        			for (var i=1; i < this.props.bingoWinners.length; i++) {
        				winnersStr += ", ";
        				winnersStr += this.props.bingoWinners[i];
        			}
        		}        
        		return (
        			<div className="modalBg">
	                 	<div className="modal">	                 		
        					<div className="modalHeader">
        						Game over! 
        					</div>
        					<div className="modalSubheader" id="modalConfirmation">
        						<b>Winners:</b> <br/>
        						{winnersStr}
        					</div>
	              		</div>
	                </div>
        		);
        	} else if (this.props.modalType == "outOfChecks") {
        		return (
        			<div className="modalBg">
	                 	<div className="modal">	                 		
        					<div className="modalHeader">
        						Uh oh!
        					</div>
        					<div className="modalSubheader" id="modalConfirmation">
        						You are out of bingo checks. You can still play for fun! <br/>
        					</div>
        					<div className="modalFooter">
        						<div id="singleButtonContainer">
									<div className="modalButton blueButton" id="rightModalButton" onClick={this.props.onCancel}>Keep playing!</div>
								</div>
							</div>
	              		</div>
	                </div>
        		);
        	} else {
        		return (
        			<div className="">
                	</div>
        		);
        	}
        } else {
        	return (
        		<div className="">
                </div>
        	);
        }
    }
});

ReactDOM.render(
	// <ContentTool cards={cards} />,
	<StudentView url="/api/student" pollInterval={2000}/>,
	document.getElementById('content')
);


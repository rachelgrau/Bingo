
var leaderBoardPositions = {
  0: "1st",
  1: "2nd",
  2: "3rd",
  3: "4th"
}

var debug = true;
var CONTENT_TOOL_URL = "https://api-dev.nearpod.com/v1/ct/";
var LIVE_PRES_URL = "https://api-dev.nearpod.com/v1/";
var TEACHER_URL = "https://api-dev.nearpod.com/v1/hub/teacher/";

/* State
 * -------
 * slideID (int): the ID of this slide in the presentation (from URL)
 * jwt (string): JWT token from URL (from URL)
 * presentaitonID (int): the ID of this particular presentation (from URL)
 * gameOver (boolean): true when the teacher has ended the game, false otherwise
 * cards (array): an array of all the questions/answers. Gets shuffled at beginning, then doesn't change
 * indexOfCurrQuestion (int): the index of the current question in the cards array 
 * responsesForStudents (dictionary): dictionary mapping student device IDs to their individualized responses
 * 		- each response has:
 * 				- nextQuestion (string): the current question
 *        - cards (array): the student's board
 *        - gameOver (boolean): whether the game is over
 * currentQuestionAnswers (array): abbreviated version of student responses. An array of the students' answers to the current question. Each dictionary in the array contains:
 * 		- "device_uid": student's device ID
 *    - "hasBingo" (boolean): whether the student has bingo 
 *    - "nickname" (string): student's name
 * 		- "answer" (string): the student's answer, or "" if no answer yet
 *		- "isCorrect" (boolean): whether the student's answer was correct, or false if still hasn't answered
 * currentQuestionStats (dictionary): the stats for the current question overall
 *		- "numCorrect" (int): # of students that have gotten this question correct
 * 		- "numIncorrect" (int): # of students that have gotten this question incorrect
 * 		- "numUnanswered" (int): # of students that have not yet answered this question incorrect
 *		- "totalStudents" (int): total # of students
 * leaderBoard (array): array of students who have bingo 
 * buttonsEnabled (boolean): a boolean that lets us know whether we can press next/end game button or if we need to wait for a response to come in
 *    - set to false at the end of handleNextButtonPressed, and set to true after updating data that came in
 *    - only do stuff when they press th enext button if canPressNext = true
 * modalType (string): type of modal to open
 * isModalOpen (boolean): whether or not to open the modal 
 * allQuestionsByQuestion (array): array of dictionaries to keep track of all the student responses, by question. Each dictionary looks like: 
 * 		{
			"answer": "Blatant",
			"numCorrect": 3,
			"numAnswered" 4
 		}
 * allQuestionsByStudent (array): array of dictionaries that look like:
 * 		 {
 			"nickname": "Ricky",
      "device_uid": 1,
			"answers": [
				{ 
					"question": "Brazenly obvious; flagrant; offensively noisy or loud",
					"answer": "Blatant",
					"wasCorrect": true
				}, {
					"question": "Subject to, led by, or indicative of a sudden, odd notion or unpredictable change; erratic"
        			"answer": "Capricious",
					"wasCorrect": true	
				}
				{
					"question": "Easily managed or handled; tractable"
        			"answer": "Pass",
					"wasCorrect": false	
				}
			],
			"stats": {
				"numCorrect": 2,
				"numIncorrect": 1
			}
 		}
 */

var jwt = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJDVCIsImV4cCI6MTQ2NDQ5ODA4MSwicmVmcmVzaCI6NzIwMCwiYXVkIjoiN2RhYmFjNjQ2ODFhN2MxMmMxY2I5NzE4M2M0NGRlOTMiLCJpYXQiOjE0NjQ0OTA4ODEsInVpZCI6InQ5cHZ4azhtbG91NzlwaHRiZXRyZzhmd2dod3U2bGlucHlmb2NzeCIsInRrbiI6IiIsImlzVGVhY2hlciI6IjEiLCJwZXJtcyI6WyJ0ZWFjaGVyXC9jdXN0b21fc3RhdHVzIiwidGVhY2hlclwvcmVzcG9uc2VzIl0sImV4dHJhIjp7ImN1c3RvbV9zbGlkZV9pZCI6IjEwMDAwNDgiLCJzbGlkZSI6IjEiLCJzZXNzaW9uX3VpZCI6IiJ9fQ.iugrpDK8KaAl_mhiK0Y7SwZUdU0nXMXCVbJewL621Ik";
var presentationId = "118814";
var slideID = "1000048";
var TeacherView = React.createClass({
  getUrlVars: function() {
      var vars = {};
      var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
          vars[key] = value;
      });
      return vars;
  },
  setHeaders: function(){
    // if (debug) console.log("Setting JWT: " + this.state.jwt);
    return {"x-api-key":"7dabac64681a7c12c1cb97183c44de93", "JWT": this.state.jwt};
  },
	getInitialState: function() {
    var urlVars = this.getUrlVars();
		return {
      slideID: urlVars["id"],
      jwt: urlVars["jwt"],
      presentationID: urlVars["presentation_id"],
			gameOver: false,
			cards:[], 
			indexOfCurrQuestion: 0,
			currentQuestionAnswers: [],
			currentQuestionStats: [],
			responsesForStudents: {},
			allQuestionsByQuestion: [],
			allQuestionsByStudent: [],
      leaderBoard: [],
      buttonsEnabled: false,
      isModalOpen: false,
      modalType: ""
		};
	},
  /* Callback for when the card are loaded successfully from content tool. 
   * Shuffles & stores the cards correctly in the this.state.cards 
   */
  loadGameSuccess: function (data, textStatus, jqXHR) {
    if (debug) console.log("GET initial cards succeeded, returned data: ");
    if (debug) console.log(data);
    var cards = this.shuffleCards(data.payload.custom_slide.data_teacher); 
    this.state.cards = cards;
    this.setState({cards: cards})
    if (debug) console.log("Cards:");
    if (debug) console.log(this.state.cards);     
  },
  /* Callback for when the student responses are loaded successfully. 
   * Updates the state to reflect the most current student resopnses. 
   */
  loadStudentResponsesSuccess: function (data, textStatus, jqXHR) {
    if (debug) console.log("GET student responses succeeded");
    if (debug) console.log(data);
    /* Check if new students have joined */
    this.addNewStudents(data.payload); // data.payload.studentResponses?
    this.update(data.payload); // data.payload.studentResponses?
  },
  /* POST request
   * --------------------------------------------------
   * urlStr (string): the entire URL string (e.g. "https://api-dev.nearpod.com/v1/ct/custom_slides/1") 
   * params: dictionary of parameters to post ("response" = main response data) 
   * successCallback (function): function that gets called when the POST request succeeds. Passed the data, textStatus, and jqXHR
   */
  post: function(path, params) {
    if (debug) console.log("Making POST request with path: " + path);
    if (debug) console.log("Params: ");
    if (debug) console.log(params);
    $.ajax({
        url: TEACHER_URL + path,
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
  startGameSuccess: function(data, textStatus, jqXHR) {
    if(debug) console.log("Post success");
    if(debug) console.log(data);
  },
  /* GET request (only performed if game is not over)
   * --------------------------------------------------
   * isContentTool (boolean): true if you are making a GET request to content tool, false otherwise
   * urlStr (string): the entire URL string (e.g. "https://api-dev.nearpod.com/v1/ct/custom_slides/1") 
   * params: (probably empty string for GET request)
   * successCallback (function): function that gets called when the GET request succeeds. Passed the data, textStatus, and jqXHR
   */
  get: function(urlStr, params, successCallback) {
    if (!this.state.gameOver) {
      if (debug) console.log("GET request with url: " + urlStr);
      $.ajax({
        url: urlStr,
        method: "GET",
        async: false,
        data: params,
        headers: this.setHeaders(),
        success: function(data, textStatus, jqXHR){                 
          successCallback(data, textStatus, jqXHR);
        },
        error: function(jqXHR, textStatus, errorThrown){
          this.showError(jqXHR.responseJSON);
        }
      });
    }
  },
  /*
   * Makes a GET request to the API to get the student responses. On success,
   * update the state's student responses and add any new students. 
   */
  loadStudentResponses: function() {
      this.get(TEACHER_URL + "responses", "", this.loadStudentResponsesSuccess);
  },
  /* Returns a dictionary that the teacher should post at the given moment. 
   * ----------------------------------------------------------------------
   * The teacher creates an individualized response for each student and 
   * creates a dictionary mapping students' device IDs to their individualize
   * response. Call this dictionary "studentResponses." The teacher posts a 
   * dictionary with the following keys/values:
   *        key                     value
   *        ----                    ------
   *        "nextQuestion"          (String): the current question being asked
   *        "gameOver"              (Boolean): whether the game has ended
   *        "studentResponses"      (Dictionary): the dictionary described above
   */
  getDictionaryToPost: function() {
    var toPost = {};
    /* "gameOver" */
    toPost["gameOver"] = this.state.gameOver;
    /* "studentResponses" */
    toPost["studentResponses"] = this.state.responsesForStudents;
    return toPost;
  },
	shuffleCards: function(cards) {
		if (!cards) return [];
		var currentIndex = cards.length, temporaryValue, randomIndex;
  		// While there remain elements to shuffle...
 		 while (0 !== currentIndex) {
    		// Pick a remaining element...
    		randomIndex = Math.floor(Math.random() * currentIndex);
    		currentIndex -= 1;
    		// And swap it with the current element.
    		temporaryValue = cards[currentIndex];
    		cards[currentIndex] = cards[randomIndex];
    		cards[randomIndex] = temporaryValue;
  		}
		return cards;
	},
  /*
   * Update (very important)
   * ------------------------
   * Given "studentResponses" from API ... updates the following: 
   *   - the students' answers to the current question (this.state.currentQuestionAnswers)
   *   - the stats for the current question (this.state.currentQuestionStats)
   *   - student responses: in particular, updates their boards (saying whether they got current question correct)
   */
  update: function(studentResponses) {
    var currentQuestionAnswers = this.getCurrentAnswers(studentResponses);
    var currentQuestionStats = this.getCurrentStats(studentResponses);
    this.setState({
        currentQuestionAnswers: currentQuestionAnswers,
        currentQuestionStats: currentQuestionStats,
        buttonsEnabled: true
    });
  },
  /*
   * Load initial cards and start polling for student responses.  
   */
	componentDidMount: function() {
    /* Load initial data from content tool */
    var urlStr = CONTENT_TOOL_URL + "custom_slides/" + this.state.slideID;
    this.get(urlStr, "", this.loadGameSuccess);
    /* Every X seconds, poll for student responses */
    setInterval(this.loadStudentResponses, 2000);  
	},
	/* Goes through all of the student responses for the current question and 
	   moves them to the repositories of "past" questions (e.g. this.state.allQuestionsByStudent and this.state.allQuestionsByQuestion) 
     If the student hasn't answered the question, mark it as incorrect.
	*/
	putCurrentAnswersInPast: function() {
		/* The question we are currently moving on from */
		var questionToSave = this.state.cards[this.state.indexOfCurrQuestion].question;
		/* Create an entry to put in this.state.allQuestionsByQuestion */
		var thisQuestion = {
			"answer": this.state.cards[this.state.indexOfCurrQuestion].answer,
			numCorrect: 0,
			numAnswered: 0
		};
		/* Loop over all the students' answers to the question we are about to leave */
		for (var i=0; i < this.state.currentQuestionAnswers.length; i++) {
      var currStudentDeviceID = this.state.currentQuestionAnswers[i].device_uid;
			var currAnswer = this.state.currentQuestionAnswers[i].answer;
			var wasCorrect = this.state.currentQuestionAnswers[i].isCorrect;
			if (currAnswer == "") wasCorrect = false; /* If current still unanswered, mark as incorrect */ 
			/* Update the entry for this.state.allQuestionsByQuestion */
			if (wasCorrect) thisQuestion.numCorrect++;
			thisQuestion.numAnswered++;
			/* Find that student in our array for past questions */
			for (var j=0; j < this.state.allQuestionsByStudent.length; j++) {
				var currEntry = this.state.allQuestionsByStudent[j];
				if (currEntry.device_uid == currStudentDeviceID) {
					/* Add to their list of answers */
					var answerDict = {
					"question": questionToSave,
					"answer": currAnswer,
					"wasCorrect": wasCorrect
					}
					/* Update their stats */
					var stats = currEntry.stats;
					if (wasCorrect) {
						stats["numCorrect"]++;
					} else {
						stats["numIncorrect"]++;
					}

					currEntry.answers.push(answerDict);
					currEntry.stats = stats;
					this.state.allQuestionsByStudent[j] = currEntry;
				}
			}
		}
		this.state.allQuestionsByQuestion.push(thisQuestion);
	},
	/* Called when the teacher clicks "next question."
   * Increments the index of the current question, moves the answers to the
   * current question to past questions, clears the current question array, 
   * and updates the responses for students (changes their current question).
	 * */
	handleNextQuestion: function() {
    if (this.state.buttonsEnabled) {
      this.putCurrentAnswersInPast();
      var indexOfNextQuestion = this.state.indexOfCurrQuestion + 1;
      /* Clear current question answers */
      var currentAnswers = [];
      for (var i=0; i < this.state.currentQuestionAnswers.length; i++) {
        var curStudentAnswer = {};
        curStudentAnswer["nickname"] = this.state.currentQuestionAnswers[i].nickname;
        curStudentAnswer["answer"] =  "";
        curStudentAnswer["isCorrect"] = false;
        currentAnswers.push(curStudentAnswer);
      }
      /* Clear stats */
      var stats = {
        "numCorrect": 0,
        "numIncorrect": 0,
        "numUnanswered": this.state.currentQuestionAnswers.length,
        "totalStudents": this.state.currentQuestionAnswers.length
      };
      /* Update responses for students by moving onto next question, if there is another question */ 
      var responsesForStudents = this.state.responsesForStudents;
      if (indexOfNextQuestion < this.state.cards.length) {
        var nextQuestion = this.state.cards[indexOfNextQuestion].question;
        for (var key in responsesForStudents) {
          var currResponse = responsesForStudents[key];
          currResponse["nextQuestion"] = nextQuestion;
          responsesForStudents[key] = currResponse;
        }
      }
      this.setState({
          indexOfCurrQuestion: indexOfNextQuestion,
          currentQuestionAnswers: currentAnswers,
          currentQuestionStats: stats,
          responsesForStudents: responsesForStudents,
          buttonsEnabled: false
       }, function() {
          /* TO DO: POST here */
          var dictionaryToPost = this.getDictionaryToPost();
          var params = {
            "status": dictionaryToPost
          };
          this.post("custom_status", params);
        });
    }
	},
  /* Returns an array of cards for a student to set up on their board. 
   * The cards will be randomly shuffled and contain the following 
   * fields: id (int), answer (string), hasChip (boolean), teacherApproved (boolean)
   */
  createStudentBoard: function() {
    /* Create a copy of our cards but w/o answers and with hasChip and teacherApproved fields */
    var studentCards = [];
    for (var i=0; i < this.state.cards.length; i++) {
      var card = {};
      card["id"] = this.state.cards[i].id;
      card["answer"] = this.state.cards[i].answer;
      card["hasChip"] = false;
      card["teacherApproved"] = false;
      studentCards.push(card);
    }
    /* Shuffle new copy and return it */
    return this.shuffleCards(studentCards);
  },
	/* Looks at the current student responses and sees if there are any students 
   * that are currently not in this.state.allQuestionsByStudent record. If so, 
   * adds an entry for those new students to this.state.allQuestionsByStudent and
   * this.state.responsesForStudents. Shuffles the cards and adds them to this.state.responsesForStudents
   * entry (since student can't get cards directly from CT) */
	addNewStudents: function(studentResponses) {
    console.log(studentResponses);
    var didAddAStudent = false;
		for (var i=0; i < studentResponses.length; i++) {
			var device_uid = studentResponses[i].device_uid;
			var studentIsNew = true;
			for (var j=0; j < this.state.allQuestionsByStudent.length; j++) {
				var currentEntry = this.state.allQuestionsByStudent[j];
				if (currentEntry.device_uid == device_uid) {
					studentIsNew = false;
					break;
				}
			}
			if (studentIsNew) {
        didAddAStudent = true;
        /* 1. Create entry in allQuestionsByStudent */
				var newStudent = {};
				newStudent["nickname"] = studentResponses[i].nickname;
        newStudent["device_uid"] = studentResponses[i].device_uid;
				newStudent["answers"] = [];
				newStudent["stats"] = {
					"numCorrect": 0,
					"numIncorrect": 0
				};
				this.state.allQuestionsByStudent.push(newStudent);
        /* 2. Create entry in responsesForStudents */
        var newStudentResponse = {};
        var device_uid = studentResponses[i].device_uid;
        var currentQuestion = this.state.cards[this.state.indexOfCurrQuestion].question;
        newStudentResponse["nextQuestion"] = currentQuestion;
        newStudentResponse["cards"] = this.createStudentBoard();
        newStudentResponse["gameOver"] = this.state.gameOver;
        this.state.responsesForStudents[device_uid] = newStudentResponse;
			}
		}
    /* If we got a new student, do a POST so they can get cards & set up board. */
    if (didAddAStudent) {
      var dictionaryToPost = this.getDictionaryToPost();
      var params = {
        "status": dictionaryToPost
      };
      
      this.post("custom_status", params);
    }
    if (debug) console.log("Added new students! Here are cards: ");
    if (debug) console.log(this.state.cards);
	},
	/*
	 * When the student passes on a question, returns true if that pass was correct (i.e., the correct answer was not on their board)
	 * and false if they shouldn't have passed (i.e., the correct answer WAS on their board).
	 * studentBoard (array): array of cards; the student's board
	 * correctAnswer (string): answer to search board for (if this answer is on their board, they incorrectly passed)
	 */
	passWasCorrect: function(studentBoard, correctAnswer) {
		for (var i=0; i < studentBoard.length; i++) {
			var card = studentBoard[i];
			if (card.answer == correctAnswer) return false;
		}
		return true;
	},
  /* Given the answer on a card, returns that card's ID */
  getCardIdFromAnswer: function(answer) {
    for (var i=0; i<this.state.cards.length; i++) {
      var card = this.state.cards[i];
      if (card.answer == answer) {
        return card.id;
      }
    }
    return -1;
  },
  /*
   * Given a student's device ID and the ID of a card on their board, 
   * sets that card as "teacherApproved" in this.state.responsesForStudents
   * for that particular student. 
   */
  approveCardForStudent: function(device_uid, cardID) {
    var studentCards = this.state.responsesForStudents[device_uid].cards;
    for (var i=0; i < studentCards.length; i++) {
      var currCard = studentCards[i];
      if (currCard.id == cardID) {
        currCard["teacherApproved"] = true;
        studentCards[i] = currCard;
        break;
      }
    } 
    this.state.responsesForStudents[device_uid].cards = studentCards;
  },
  /*
   * Updates the given student's board in this.state.responsesForStudents
   * so that the card they got wrong holds the correct answer + question they
   * were answering. 
   * 
   * device_uid: ID of student that got question wrong
   * studentAnswer (string): whatever the student answered (that was incorrect)
   * correctCardID (int): ID of the card they should have answered
   * question (string): question they answered incorrectly 
   */
  markCardIncorrectForStudent: function(device_uid, studentAnswer, correctCardID, question) {
    var studentCards = this.state.responsesForStudents[device_uid].cards;
    for (var i=0; i < studentCards.length; i++) {
      var currCard = studentCards[i];
      if (currCard.answer == studentAnswer) {
        currCard["teacherApproved"] = false;
        currCard["correctCardID"] = correctCardID;
        currCard["questionIncorrectlyAnswered"] = question;
        studentCards[i] = currCard;
        break;
      }
    }
    this.state.responsesForStudents[device_uid].cards = studentCards;
  },
  	/*
  	 * Given the student responses from the API, this method returns an array of the student answers
  	 * with 1 dictionary per student, where each dictionary contains "nickname" "answer" and "isCorrect"
  	 * (What this.state.currentQuestionAnswers should be)
     * 
     * Along the way, it also updates this.state.responsesForStudent based on their current
     * responses (updates each student's "cards" by marking cards as teacherApproved or not), and 
     * Also updates the leaderboard if a student gets bingo.
  	 */
  	getCurrentAnswers: function (studentResponses) {
  		var answers = [];
  		for (var i=0; i < studentResponses.length; i++) {
  			var questionStudentIsAnswering = studentResponses[i].question;
  			var currentQuestion = this.state.cards[this.state.indexOfCurrQuestion].question;
  			
  			var curStudentAnswer = {};
  			curStudentAnswer["nickname"] = studentResponses[i].nickname;
        curStudentAnswer["device_uid"] = studentResponses[i].device_uid;

        /* If student got bingo, add them to leader board */
        if (studentResponses[i].hasBingo) {
          var alreadyInLeaderboard = false;
          for (var j=0; j<this.state.leaderBoard.length; j++) {
            if (this.state.leaderBoard[j] == studentResponses[i].device_uid) {
              alreadyInLeaderboard = true;
              break;
            }
          }
          if (!alreadyInLeaderboard) {
            this.state.leaderBoard.push(studentResponses[i].device_uid);
          }
        }
      
  			var answer = studentResponses[i].answer;
  			if (questionStudentIsAnswering != currentQuestion) {
  				/* 1) NOT YET ANSWERED: We have not yet received the student's answer to this question */
  				curStudentAnswer["answer"] = "";
  				curStudentAnswer["isCorrect"] = false;
  			} else if (studentResponses[i].didPass) {
  				/* 2) PASSED: They passed the current question; check if valid */
  				curStudentAnswer["answer"] = "Pass";
  				curStudentAnswer["isCorrect"] = this.passWasCorrect(studentResponses[i].cards, this.state.cards[this.state.indexOfCurrQuestion].answer);
  			} else {
  				/* We received this student's answer for this question */
  				curStudentAnswer["answer"] =  studentResponses[i].answer;
          if (studentResponses[i].answer == this.state.cards[this.state.indexOfCurrQuestion].answer) {
            /* 3) CORRECT: Mark this card in the student's board as teacher approved */
            curStudentAnswer["isCorrect"] = true;
            this.approveCardForStudent(studentResponses[i].device_uid, this.state.cards[this.state.indexOfCurrQuestion].id);
          } else {
            /* 4) INCORRECT: Mark this card in student's board as NOT teacher approved, give correct answer */
            curStudentAnswer["isCorrect"] = false;
            this.markCardIncorrectForStudent(studentResponses[i].device_uid, studentResponses[i].answer, this.state.cards[this.state.indexOfCurrQuestion].id, currentQuestion);
          }
  			}
  			answers.push(curStudentAnswer);
  		}

  		return answers;
  	},
  	/*
  	 * Given the student responses from the API, this method returns a dictionary of stats
  	 * with the following fields: "numCorrect", "numIncorrect", "numUnanswered", "totalStudents"
  	 * (What this.state.currentQuestionStats should be)
  	 */
  	getCurrentStats: function (studentResponses) {
  		var stats = {
  			"numCorrect": 0,
  			"numIncorrect": 0,
  			"numUnanswered": 0,
  			"totalStudents": studentResponses.length
  		};
  		for (var i=0; i < studentResponses.length; i++) {
  			var questionStudentIsAnswering = studentResponses[i].question;
  			var currentQuestion = this.state.cards[this.state.indexOfCurrQuestion].question;
  			var answer = studentResponses[i].answer;
  			if (questionStudentIsAnswering != currentQuestion) {
  				answer = "";
  			}
  			if (answer == "") {
  				stats.numUnanswered++;
  			} else {
  				var isCorrect = (studentResponses[i].answer == this.state.cards[this.state.indexOfCurrQuestion].answer);
  				if (isCorrect) {
  					stats.numCorrect++;
  				} else {
  					stats.numIncorrect++;
  				}
  			}
  		}
  		return stats;
  	},
  	handleEndGame: function() {
      if (this.state.buttonsEnabled) {
        this.openModal("endGame");
      }
  	},
    /* Called when the user clicks "yes" to close the modal. Check what the curent modal type is and act accordingly.
     * "endGame": set gameOver to true 
     */
    closeModalAccept: function() {
      switch(this.state.modalType) {
        case "endGame":
          this.putCurrentAnswersInPast();
          this.setState({
            "gameOver": true,
            modalType: "",
            isModalOpen: false
          });
          /* TO DO: POST here. */
          var dictionaryToPost = this.getDictionaryToPost();
          var params = {
            "status": dictionaryToPost
          };
          this.post("custom_status", params);
          break;
        default:
          /* Close modal */
          this.setState({isModalOpen: false, modalType:""});
          break;
      }
    },
    /* Called when the user clicks "cancel" to close the modal. Just close the modal.
     */
    closeModalCancel: function() {
      switch(this.state.modalType) {
        case "endGame":
          this.setState({modalType: "", isModalOpen: false});
          break;
        default:
          /* Close modal */
          this.setState({isModalOpen: false, modalType:""});
          break;
      }
    },
    /* The app uses one shared modal, so we open & close it as needed and just change its inner content.
     * modalType (string): the type of modal you want to open
     */
    openModal: function(modalType) {
        this.setState({modalType: modalType, isModalOpen: true});
    },
  	render: function() {
  		/* Get the current question + answer */
  		var currentQuestion = "";
  		var currentAnswer = "";
  		if (this.state.indexOfCurrQuestion < this.state.cards.length) {
  			currentQuestion = this.state.cards[this.state.indexOfCurrQuestion].question;
  			currentAnswer = this.state.cards[this.state.indexOfCurrQuestion].answer;
  		}
  		if (this.state.indexOfCurrQuestion == this.state.cards.length - 1) {
  			this.state.buttonsEnabled = false;
  		}
  		/* Display game normally */
  		if (!this.state.gameOver) {
  			return (
  				<div className="teacherContent">
					 <CurrentQuestion question={currentQuestion} answer={currentAnswer} canPressNext={this.state.buttonsEnabled} indexOfCurrentQuestion={this.state.indexOfCurrQuestion} numTotalQuestions={this.state.cards.length} studentAnswers={this.state.currentQuestionAnswers} currentStats={this.state.currentQuestionStats} handleNextQuestion={this.handleNextQuestion} leaderBoard={this.state.leaderBoard}/>
					 <PastQuestions allQuestionsByStudent={this.state.allQuestionsByStudent} allQuestionsByQuestion={this.state.allQuestionsByQuestion} onEndGame={this.handleEndGame} leaderBoard={this.state.leaderBoard}/>
				   <Modal isOpen={this.state.isModalOpen} modalType={this.state.modalType} onAccept={this.closeModalAccept} onCancel={this.closeModalCancel}/>
          </div>
  			);
  		/* If game is over, display results */
  		} else {
  			return (
				  <ResultsTable allQuestionsByStudent={this.state.allQuestionsByStudent} cards={this.state.cards} numQuestions={this.state.indexOfCurrQuestion + 1} leaderBoard={this.state.leaderBoard}/>
  			);
  		}
	}
});

/*
 * Props
 * -----
 * question (string): the current question
 * answer (string): the current answer
 * indexOfCurrentQuestion (int): the index of the current question
 * numTotalQuestions (int): number of total questions
 * canPressNext (boolean): true if the "Next question" button should be active, false otherwise
 * studentAnswers (array): the students' answers to the current question
 * currentStats (dictionary): a dictionary with the stats for this question ("numCorrect" "numIncorrect" "numUnanswered" and "totatlStudents")
 * leaderBoard (array): array of students that have bingo 
 */
var CurrentQuestion = React.createClass({
	pressedNext: function() {
		if (this.props.canPressNext) {
			this.props.handleNextQuestion();
		}
	},
	render: function() {
		var nextButtonClass = "blueButton";
		if (!this.props.canPressNext) {
			nextButtonClass = "inactiveButton";
		}
		return (
			<div className="currentQuestion">
				<h1> Current question: {this.props.indexOfCurrentQuestion + 1}/{this.props.numTotalQuestions} </h1>
				<hr color="#06AAFF"/>
				<QuestionAnswer question={this.props.question} answer={this.props.answer}/>
				<Graph stats={this.props.currentStats}/>
				<div className={nextButtonClass} id="nextQuestion" onClick={this.pressedNext}>
					Next question
				</div>
				<CurrentQuestionAnswers studentAnswers={this.props.studentAnswers} leaderBoard={this.props.leaderBoard}/>
			</div>
		);
	}

});

/*
 * Props
 * -----
 * question (string): the current question
 * answer (string) the current answer
 */
var QuestionAnswer = React.createClass({
	render: function() {
		var questionClass = "question questionNormal";
		if (this.props.question.length > 88) questionClass = "question questionSmall";
		return (
			<div className="questionAnswer">
				<div className={questionClass}>
					<div className="verticallyCentered">{this.props.question}</div>
				</div>
				<div className="answer">
					<div className="verticallyCentered">{this.props.answer}</div>
				</div>
			</div>
		);
	}

});

/*
 * Props
 * -----
 * stats (dictionary): a dictionary with the stats for this question ("numCorrect" "numIncorrect" "numUnanswered" and "totatStudents")
 */
var Graph = React.createClass({
	render: function() {
		var numStudents = this.props.stats.totalStudents;

    /* Create slices for pie chart */
    var slices = [];
    if (numStudents > 0) {
      slices = [
        { color: '#5FD598', value: (this.props.stats.numCorrect/numStudents)*100 }, // correct
        { color: '#F26C59', value: (this.props.stats.numIncorrect/numStudents)*100 }, // incorrect
        { color: '#E7E7E7', value: (this.props.stats.numUnanswered/numStudents)*100 } // unanswered
      ];
    } else {
      slices = [
        { color: '#E7E7E7', value: 100 } // unanswered
      ];
    }
    
		return (
			<div className="graph">
				<div className="graphVisual">
          <PieChart slices={slices} />
        </div>
				<div className="graphStats">
					<table className="statsTable">
						<tbody>
							<tr>
								<td><img src="assets/greenCircle.png"/></td>
								<td>{this.props.stats.numCorrect}/{numStudents} correct</td>
							</tr>
							<tr >
								<td><img src="assets/redCircle.png"/></td>
								<td>{this.props.stats.numIncorrect}/{numStudents} incorrect</td>
							</tr>
							<tr>
								<td><img src="assets/grayCircle.png"/></td>
								<td>{this.props.stats.numUnanswered}/{numStudents} unanswered</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		);
	}
});

/*
 * Props
 * -----
 * studentAnswers (array): the students' answers to the current question. An array of dictionaries, where each dictionary looks like:
 * 		- "nickname": student's name
 * 		- "answer": the student's answer, or "" if no answer yet
 *		- "isCorrect": whether the student's answer was correct, or false if still hasn't answered
 * leaderBoard (array): array of students that have bingo 
 */
var CurrentQuestionAnswers = React.createClass({
	render: function() {
		var table = [];
		/* Loop over and add table entry for each student answer */
		for (var i=0; i < this.props.studentAnswers.length; i++) {
			var cur = this.props.studentAnswers[i];	
      var studentName = [];
      studentName.push(cur.nickname + " ");

      /* See if this student has bingo */
      var leaderBoardPos = -1;
      for (var j=0; j < this.props.leaderBoard.length; j++) {
        if (this.props.leaderBoard[j] == this.props.studentAnswers[i].device_uid) {
          leaderBoardPos = j;
        }
      }
      if (leaderBoardPos != -1) {
        var leaderBoardPosStr = leaderBoardPositions[leaderBoardPos];
        if (!leaderBoardPosStr || (leaderBoardPosStr.length==0)) {
          leaderBoardPosStr = (leaderBoardPos + 1) + "th";
        }
        studentName.push(<div className="leaderChip">{leaderBoardPosStr}</div>);
      } 
			if (cur.answer == "") {
				/* Question still unanswered */
				table.push(
					<tr>
						<td className="studentName">
              {studentName}
            </td>
					    <td className="tableAnswer unanswered">–</td> 
					  	<td className="emptyColumn"></td>
					</tr>
				);
			} else if (cur.isCorrect) {
				/* Question correct*/
				table.push(
					<tr>
						<td className="studentName">{studentName}</td>
					    <td className="tableAnswer correctAnswer">{cur.answer}</td> 
					  	<td className="emptyColumn"></td>
					</tr>
				);
			} else {
				/* Question incorrect */
				table.push(
					<tr>
						<td className="studentName">{studentName}</td>
					    <td className="tableAnswer incorrectAnswer">{cur.answer}</td> 
					  	<td className="emptyColumn"></td>
					</tr>
				);
			}
		}
    /* First add headers in their own table, then add rest of table in scrollable div */
		return (
      <div>
        <table className="simpleTable">
            <tbody>
              <tr className="tableHeader">
                <th className="tableHeader studentName">Student</th>
                <th className="tableHeader tableAnswer">Answer</th> 
                <th className="tableHeader"></th>
              </tr>
            </tbody>
        </table>
        <div className="currentQuestionsContainer">
    			<table className="simpleTable">
    				<tbody>
    				  {table}
    			  </tbody>
    			</table>
        </div>
      </div>
		);
	}
});

/*
 * State
 * ------
 * sortBy (string): either "question" or "student" 
 * 
 * 
 * Props
 * -----
 * allQuestionsByStudent (array): array of dictionaries that contain each student's record for this game. See Teacher
 * 						  component's "allQuestionsByStudent" array.
 * allQuestionsByQuestion (array): array of past question + answers, sorted by questions (see Teacher component's state.allQuestionsByQuestion)
 * onEndGame (function): callback that gets called when the teacher presses "End game"
 * leaderBoard (array): array of students that have bingo 
 */
var PastQuestions = React.createClass({
	getInitialState: function() {
		return {
			sortBy: "student"
		};
	},
	changeSortBy: function() {
		var newState = "question";
		if (this.state.sortBy == "question") {
			newState = "student";
		} 
		this.setState({sortBy: newState});
	},
	render: function() {
		return (
			<div className="pastQuestions">
				<h1> All questions sorted by: <span className="sortBy" onClick={this.changeSortBy}>{this.state.sortBy}</span> </h1>
				<hr color="#06AAFF"/>
				<AllAnswers allQuestionsByStudent={this.props.allQuestionsByStudent} sortBy={this.state.sortBy} allQuestionsByQuestion={this.props.allQuestionsByQuestion} leaderBoard={this.props.leaderBoard}/>
				<div className="outlineButton" id="endGameButton" onClick={this.props.onEndGame}>
					End game
				</div>
			</div>
		);
	}
});

/*
 * Props
 * -----
 * allQuestionsByStudent (array): array of dictionaries that contain each student's record for this game. See Teacher
 * 						  component's "allQuestionsByStudent" array.
 * allQuestionsByQuestion (array): array of past question + answers, sorted by questions (see Teacher component's state.allQuestionsByQuestion)
 * sortBy (string): if this string == "question", then we'll sort by question; if it's "student" to sort by student
 * leaderBoard (array): array of students that have bingo
 */
var AllAnswers = React.createClass({
	render: function() {
		var table = [];
		if (this.props.sortBy == "student") {			
			/* SORT BY STUDENT 
			 * Use this.props.allQuestionsByStudent
			 */
			for (var i=0; i < this.props.allQuestionsByStudent.length; i++) {
				var cur = this.props.allQuestionsByStudent[i];	
				var curStats = cur.stats;
				var totalQuestionsAnswered = curStats["numCorrect"] + curStats["numIncorrect"];
				var percentage = 0;
				if (totalQuestionsAnswered > 0) {
					percentage = Math.floor((curStats["numCorrect"] / totalQuestionsAnswered) * 100);
				} 

        /* See if this student has bingo */
        var studentName = [];
        studentName.push(cur.nickname + " ");
        var leaderBoardPos = -1;
        for (var j=0; j < this.props.leaderBoard.length; j++) {
          if (this.props.leaderBoard[j] == cur.device_uid) {
            leaderBoardPos = j;
          }
        }
        if (leaderBoardPos != -1) {
          if (leaderBoardPos != -1) {
            var leaderBoardPosStr = leaderBoardPositions[leaderBoardPos];
            if (!leaderBoardPosStr || (leaderBoardPosStr.length==0)) {
              leaderBoardPosStr = (leaderBoardPos + 1) + "th";
            }
            studentName.push(<div className="leaderChip">{leaderBoardPosStr}</div>);
          }
        } 

				if (totalQuestionsAnswered == 0) {
					table.push(
						<tr>
					    	<td className="studentNamePast">{studentName}</td>
					    	<td className="fractionScore unanswered">0/0</td> 
					  		<td className="percentageScore unanswered">–</td> 
					 	</tr>
					);
				} else if (percentage >= 50) {
					table.push(
						<tr>
					    	<td className="studentNamePast">{studentName}</td>
					    	<td className="fractionScore correctAnswer">{curStats["numCorrect"]}/{totalQuestionsAnswered}</td> 
					  		<td className="percentageScore correctAnswer">{percentage}%</td> 
					 	</tr>
					);
				} else {
					table.push(
						<tr>
						    <td className="studentNamePast">{studentName}</td>
						    <td className="fractionScore incorrectAnswer">{curStats["numCorrect"]}/{totalQuestionsAnswered}</td> 
						  	<td className="percentageScore incorrectAnswer">{percentage}%</td> 
						 </tr>
					);
				}
			}
		}  else {
			/* SORT BY QUESTION 
			 * Use this.props.allQuestionsByQuestion
			 */
			for (var i=0; i<this.props.allQuestionsByQuestion.length; i++) {
				var currQuestion = this.props.allQuestionsByQuestion[i];
				var percentage = Math.floor((currQuestion.numCorrect/currQuestion.numAnswered) * 100);
				if (percentage >= 50) {
					table.push(
						<tr>
							<td className="studentNamePast">{currQuestion.answer}</td>
							<td className="fractionScore correctAnswer">{currQuestion.numCorrect}/{currQuestion.numAnswered}</td> 
							<td className="percentageScore correctAnswer">{percentage}%</td>
						</tr>
					);
				} else {
					table.push(
						<tr>
							<td className="studentNamePast">{currQuestion.answer}</td>
							<td className="fractionScore incorrectAnswer">{currQuestion.numCorrect}/{currQuestion.numAnswered}</td> 
							<td className="percentageScore incorrectAnswer">{percentage}%</td>
						</tr>
					);
				}
			}
		}
		return (
      <div className="pastQuestionsContainer">
  			<table className="simpleTable">
  				<tbody>
  					{table}
  				</tbody>
  			</table>
      </div>
		);
	}
});

/*
 * Props
 * -----
 * allQuestionsByStudent (array): array with results (see Teacher component's state.allQuestionsByStudent)
 * numQuestions (int): total # of questions asked
 * cards (array): array of cards in the order that they were asked
 * leaderBoard (array): array of students that have bingo
 */
var ResultsTable = React.createClass({
	render: function() {
		/* Put all answers in table header */
  		var answerHeaders = [];
  		var wordScores = [];
  		for (var i=0; i < this.props.numQuestions; i++) {
  			var answer = this.props.cards[i].answer;
  			answerHeaders.push(
  				<th className="tableHeader resultsTableHeader">
  					{answer}
  				</th>
  			);
  			wordScores.push(0);
  		}

  		/* Create table */
  		var table = [];
  		for (var i=0; i < this.props.allQuestionsByStudent.length; i++) {
  			var currStudentInfo = this.props.allQuestionsByStudent[i];
  			/* This student's overall score */
  			var percentage = Math.floor((currStudentInfo.stats.numCorrect / (this.props.numQuestions)) * 100);
  			/* Build up table cells for this student's answer to every question */
  			var studentAnswers = [];
  			for (var j=0; j<currStudentInfo.answers.length; j++) {
  				var answer = currStudentInfo.answers[j].answer;
  				if (answer == "") answer = "–";
				if (currStudentInfo.answers[j].wasCorrect) {
					/* Increment the number of correct answers for this word */
					wordScores[j]++;
					/* Add the table cell for this student's correct answer to this word */
					studentAnswers.push(
						<td className="correctAnswer bottomGray resultsTableCell">
							{answer}
						</td>
					);
				} else {
					studentAnswers.push(
						<td className="incorrectAnswer bottomGray resultsTableCell">
							{answer}
						</td>
					);
				  }
  		  }
  		  var percentageClassName = "correctAnswer bottomGray resultsTableCell studentTotalColumn";
  		  if (percentage < 50) percentageClassName = "incorrectAnswer bottomGray resultsTableCell studentTotalColumn";

        /* See if this student has bingo */
        var studentName = [];
        studentName.push(currStudentInfo.nickname + " ");
        var leaderBoardPos = -1;
        for (var j=0; j < this.props.leaderBoard.length; j++) {
          if (this.props.leaderBoard[j] == currStudentInfo.device_uid) {
            leaderBoardPos = j;
          }
        }
        if (leaderBoardPos != -1) {
          if (leaderBoardPos != -1) {
            var leaderBoardPosStr = leaderBoardPositions[leaderBoardPos];
            if (!leaderBoardPosStr || (leaderBoardPosStr.length==0)) {
              leaderBoardPosStr = (leaderBoardPos + 1) + "th";
            }
            studentName.push(<div className="leaderChip">{leaderBoardPosStr}</div>);
          }
        }
      table.push(
  				<tr>
  					<td className="studentNameColumn resultsTableCell">{studentName}</td>
  					<td className={percentageClassName}>{percentage}%</td>
  					{studentAnswers}
  				</tr>
  			);
  		}
  		/* Calculate scores for each word and format them as percentages*/
  		var percentages = [];
  		var numTotalStudents = this.props.allQuestionsByStudent.length;
  		for (var i=0; i < wordScores.length; i++) {
  			var numCorrect = wordScores[i];
  			var percentage = Math.floor((numCorrect/numTotalStudents)*100);
  			if (percentage >= 50) {
  				percentages.push(
  					<td className="correctAnswer resultsTableCell">{percentage}%</td>
  				);
  			} else {
  				percentages.push(
  					<td className="incorrectAnswer resultsTableCell">{percentage}%</td>
  				);
  			}
  		}

  		return (
			<table className="resultsTable">
				<tbody>
				  <tr className="tableHeader">
				    <th className="tableHeader resultsTableHeader studentNameColumn"></th>
				    <th className="tableHeader resultsTableHeader studentTotalColumn">Student total</th>
				    {answerHeaders}
				  </tr>
				  {table}
				  <tr>
				  	<td className="resultsTableCell"></td>
				  	<td className="resultsTableCell studentTotalColumn"></td>
				  	{percentages}
				  </tr>
			  </tbody>
			</table>
		); 
	}
});

/*
 * Props
 * -----
 * isOpen (boolean): whether or not the modal is currently open
 * modalType(string): one of the following
 *    - "endGame": Text + two buttons (yes / go back)
 * onCancel (function): the callback for when student clicks "cancel" button (regardless of modal type)
 * onAccept (function): the callback for when student clicks "yes" button (regardless of modal type)
 */
var Modal = React.createClass({
    render: function() {
      if (this.props.isOpen) {
        if (this.props.modalType == "endGame") {
          return (
            <div className="modalBg">
              <div className="modal">
                <div className="modalHeader">Are you sure you want to end the game? </div>
                <div className="modalFooter">
                  <div id="twoButtonContainer">
                    <div className="modalButton outlineButton" id="leftModalButton" onClick={this.props.onCancel}>No, go back.</div>
                    <div className="modalButton blueButton" id="rightModalButton" onClick={this.props.onAccept}>Yes, end the game.</div>
                  </div>
               </div>
              </div>
            </div>
          );
        } else {
          return (
            <div>
            </div>
          );
        }
      } else {
        return (
          <div>
          </div>
        );
      }
    }
});


'use strict';

var PropTypes = React.PropTypes;

/**
 * Generates an SVG pie chart.
 * @see {http://wiki.scribus.net/canvas/Making_a_Pie_Chart}
 */
var PieChart = React.createClass({
  displayName: 'PieChart',

  propTypes: {
    className: PropTypes.string,
    size: PropTypes.number,
    slices: PropTypes.arrayOf(PropTypes.shape({
      color: PropTypes.string.isRequired, // hex color
      value: PropTypes.number.isRequired })).isRequired },

  /**
   * @return {Object}
   */
  getDefaultProps: function getDefaultProps() {
    return {
      size: 60 };
  },

  /**
   * @return {Object[]}
   */
  _renderPaths: function _renderPaths() {
    var radCircumference = Math.PI * 2;
    var center = this.props.size / 2;
    var radius = center - 1; // padding to prevent clipping
    var total = this.props.slices.reduce(function (totalValue, slice) {
      return totalValue + slice.value;
    }, 0);

    var radSegment = 0;
    var lastX = radius;
    var lastY = 0;

    return this.props.slices.map(function (slice, index) {
      var color = slice.color;
      var value = slice.value;

      // Should we just draw a circle?
      if (value === total) {
        return React.createElement('circle', {
          r: radius,
          cx: radius,
          cy: radius,
          fill: color,
          key: index
        });
      }

      if (value === 0) {
        return;
      }

      var valuePercentage = value / total;

      // Should the arc go the long way round?
      var longArc = valuePercentage <= 0.5 ? 0 : 1;

      radSegment += valuePercentage * radCircumference;
      var nextX = Math.cos(radSegment) * radius;
      var nextY = Math.sin(radSegment) * radius;

      // d is a string that describes the path of the slice.
      // The weirdly placed minus signs [eg, (-(lastY))] are due to the fact
      // that our calculations are for a graph with positive Y values going up,
      // but on the screen positive Y values go down.
      var d = ['M ' + center + ',' + center, 'l ' + lastX + ',' + -lastY, 'a' + radius + ',' + radius, '0', '' + longArc + ',0', '' + (nextX - lastX) + ',' + -(nextY - lastY), 'z'].join(' ');

      lastX = nextX;
      lastY = nextY;

      return React.createElement('path', { d: d, fill: color, key: index });
    });
  },

  /**
   * @return {Object}
   */
  render: function render() {
    var size = this.props.size;

    var center = size / 2;

    return React.createElement(
      'svg',
      { viewBox: '0 0 ' + size + ' ' + size },
      React.createElement(
        'g',
        { transform: 'rotate(-90 ' + center + ' ' + center + ')' },
        this._renderPaths()
      )
    );
  }
});

ReactDOM.render(
	<TeacherView url="/api/teacher"/>,
	document.getElementById('content')
);



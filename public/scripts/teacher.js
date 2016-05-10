/* State
 * -------
 * gameOver (boolean): true when the teacher has ended the game, false otherwise
 * cards (array): an array of all the questions/answers. Gets shuffled at beginning, then doesn't change
 * indexOfCurrQuestion (int): the index of the current question in the cards array 
 * responsesForStudents (dictionary): dictionary mapping student deviceIDs to their individualized responses
 * 		- each response has:
 * 				- nextQuestion (string): the current question
 *        - cards (array): the student's board
 *        - gameOver (boolean): whether the game is over
 * currentQuestionAnswers (array): abbreviated version of student responses. An array of the students' answers to the current question. Each dictionary in the array contains:
 * 		- "deviceID": student's deviceID
 *    - "hasBingo" (boolean): whether the student has bingo 
 *    - "name" (string): student's name
 * 		- "answer" (string): the student's answer, or "" if no answer yet
 *		- "isCorrect" (boolean): whether the student's answer was correct, or false if still hasn't answered
 * currentQuestionStats (dictionary): the stats for the current question overall
 *		- "numCorrect" (int): # of students that have gotten this question correct
 * 		- "numIncorrect" (int): # of students that have gotten this question incorrect
 * 		- "numUnanswered" (int): # of students that have not yet answered this question incorrect
 *		- "totalStudents" (int): total # of students
 * leaderBoard (array): array of students who have bingo 
 * allQuestionsByQuestion (array): array of dictionaries to keep track of all the student responses, by question. Each dictionary looks like: 
 * 		{
			"answer": "Blatant",
			"numCorrect": 3,
			"numAnswered" 4
 		}
 * allQuestionsByStudent (array): array of dictionaries that look like:
 * 		 {
 			"name": "Ricky",
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
var TeacherView = React.createClass({
	getInitialState: function() {
		return {
			gameOver: false,
			cards:[], 
			indexOfCurrQuestion: 0,
			currentQuestionAnswers: [],
			currentQuestionStats: [],
			responsesForStudents: {},
			allQuestionsByQuestion: [],
			allQuestionsByStudent: [],
      leaderBoard: []
		};
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
	loadCardsFromServer: function() {
    $.ajax({
	      url: this.props.url,
	      dataType: 'json',
	      cache: false,
	      success: function(data) {	      
    		/* If we don't have any cards yet, store them */
    		if (this.state.cards.length == 0) {
    			var cards = this.shuffleCards(data["cards"]); 
    			this.state.cards = cards;   		
    		}
    		/* Read in the student responses for current question */
    		this.addNewStudents(data["studentResponses"]);
        this.update(data["studentResponses"]);
	      }.bind(this),
	      error: function(xhr, status, err) {
	        console.error(this.props.url, status, err.toString());
	      }.bind(this)
	    });
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
          currentQuestionStats: currentQuestionStats
      });
    },
  	componentDidMount: function() {
    	this.loadCardsFromServer();
    	setInterval(this.loadCardsFromServer, this.props.pollInterval);
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
  			var currStudentName = this.state.currentQuestionAnswers[i].name;
  			var currAnswer = this.state.currentQuestionAnswers[i].answer;
  			var wasCorrect = this.state.currentQuestionAnswers[i].isCorrect;
  			if (currAnswer == "") wasCorrect = false; /* If current still unanswered, mark as incorrect */ 
  			/* Update the entry for this.state.allQuestionsByQuestion */
  			if (wasCorrect) thisQuestion.numCorrect++;
  			thisQuestion.numAnswered++;
  			/* Find that student in our array for past questions */
  			for (var j=0; j < this.state.allQuestionsByStudent.length; j++) {
  				var currEntry = this.state.allQuestionsByStudent[j];
  				if (currEntry.name == currStudentName) {
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
  		this.putCurrentAnswersInPast();
  		var indexOfNextQuestion = this.state.indexOfCurrQuestion + 1;
  		/* Clear current question answers */
  		var currentAnswers = [];
  		for (var i=0; i < this.state.currentQuestionAnswers.length; i++) {
  			var curStudentAnswer = {};
  			curStudentAnswer["name"] = this.state.currentQuestionAnswers[i].name;
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
          responsesForStudents: responsesForStudents
	     });
      console.log(this.state.responsesForStudents);
  	},
  	/* Looks at the current student responses and sees if there are any students 
     * that are currently not in this.state.allQuestionsByStudent record. If so, 
     * adds an entry for those new students to this.state.allQuestionsByStudent and
     * this.state.responsesForStudents */
	addNewStudents: function(studentResponses) {
		for (var i=0; i < studentResponses.length; i++) {
			var name = studentResponses[i].name;
			var studentIsNew = true;
			for (var j=0; j < this.state.allQuestionsByStudent.length; j++) {
				var currentEntry = this.state.allQuestionsByStudent[j];
				if (currentEntry.name == name) {
					studentIsNew = false;
					break;
				}
			}
			if (studentIsNew) {
        /* 1. Create entry in allQuestionsByStudent */
				var newStudent = {};
				newStudent["name"] = name;
				newStudent["answers"] = [];
				newStudent["stats"] = {
					"numCorrect": 0,
					"numIncorrect": 0
				};
				this.state.allQuestionsByStudent.push(newStudent);
        /* 2. Create entry in responsesForStudents */
        var newStudentResponse = {};
        var deviceID = studentResponses[i].deviceID;
        var currentQuestion = this.state.cards[this.state.indexOfCurrQuestion].question;
        newStudentResponse["nextQuestion"] = currentQuestion;
        newStudentResponse["cards"] = studentResponses[i].cards;
        newStudentResponse["gameOver"] = this.state.gameOver;
        this.state.responsesForStudents[deviceID] = newStudentResponse;
			}
		}
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
  approveCardForStudent: function(deviceID, cardID) {
    var studentCards = this.state.responsesForStudents[deviceID].cards;
    for (var i=0; i < studentCards.length; i++) {
      var currCard = studentCards[i];
      if (currCard.id == cardID) {
        currCard["teacherApproved"] = true;
        studentCards[i] = currCard;
        break;
      }
    }
    this.state.responsesForStudents[deviceID].cards = studentCards;
  },
  /*
   * Updates the given student's board in this.state.responsesForStudents
   * so that the card they got wrong holds the correct answer + question they
   * were answering. 
   * 
   * deviceID: ID of student that got question wrong
   * studentAnswer (string): whatever the student answered (that was incorrect)
   * correctCardID (int): ID of the card they should have answered
   * question (string): question they answered incorrectly 
   */
  markCardIncorrectForStudent: function(deviceID, studentAnswer, correctCardID, question) {
    var studentCards = this.state.responsesForStudents[deviceID].cards;
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
    this.state.responsesForStudents[deviceID].cards = studentCards;
  },
  	/*
  	 * Given the student responses from the API, this method returns an array of the student answers
  	 * with 1 dictionary per student, where each dictionary contains "name" "answer" and "isCorrect"
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
  			curStudentAnswer["name"] = studentResponses[i].name;
        curStudentAnswer["deviceID"] = studentResponses[i].deviceID;

        /* If student got bingo, add them to leader board */
        if (studentResponses[i].hasBingo) {
          for (var j=0; j<this.state.leaderBoard.length; j++) {
          if (this.state.leaderBoard[j] == studentResponses[i].deviceID)
            break;
          }
          this.state.leaderBoard.push(studentResponses[i].deviceID);
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
            this.approveCardForStudent(studentResponses[i].deviceID, this.state.cards[this.state.indexOfCurrQuestion].id);
          } else {
            /* 4) INCORRECT: Mark this card in student's board as NOT teacher approved, give correct answer */
            curStudentAnswer["isCorrect"] = false;
            this.markCardIncorrectForStudent(studentResponses[i].deviceID, studentResponses[i].answer, this.state.cards[this.state.indexOfCurrQuestion].id, currentQuestion);
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
  		this.putCurrentAnswersInPast();
  		this.setState({"gameOver": true});
  	},
  	render: function() {
  		/* Get the current question + answer */
  		var currentQuestion = "";
  		var currentAnswer = "";
  		if (this.state.indexOfCurrQuestion < this.state.cards.length) {
  			currentQuestion = this.state.cards[this.state.indexOfCurrQuestion].question;
  			currentAnswer = this.state.cards[this.state.indexOfCurrQuestion].answer;
  		}
  		var canPressNext = true;
  		if (this.state.indexOfCurrQuestion == this.state.cards.length - 1) {
  			canPressNext = false;
  		}

  		/* Display game normally */
  		if (!this.state.gameOver) {
  			return (
  				<div className="teacherContent">
					<CurrentQuestion question={currentQuestion} answer={currentAnswer} canPressNext={canPressNext} indexOfCurrentQuestion={this.state.indexOfCurrQuestion} numTotalQuestions={this.state.cards.length} studentAnswers={this.state.currentQuestionAnswers} currentStats={this.state.currentQuestionStats} handleNextQuestion={this.handleNextQuestion} leaderBoard={this.state.leaderBoard}/>
					<PastQuestions allQuestionsByStudent={this.state.allQuestionsByStudent} allQuestionsByQuestion={this.state.allQuestionsByQuestion} onEndGame={this.handleEndGame}/>
				</div>
  			);
  		/* If game is over, display results */
  		} else {
  			return (
				<ResultsTable allQuestionsByStudent={this.state.allQuestionsByStudent} cards={this.state.cards} numQuestions={this.state.indexOfCurrQuestion + 1}/>
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
 * stats (dictionary): a dictionary with the stats for this question ("numCorrect" "numIncorrect" "numUnanswered" and "totatlStudents")
 */
var Graph = React.createClass({
	render: function() {
		var numStudents = this.props.stats.totalStudents;
		return (
			<div className="graph">
				<div className="graphVisual"><img className="graphImage" src="../assets/graph.png"/></div>
				<div className="graphStats">
					<table className="statsTable">
						<tbody>
							<tr>
								<td><img src="../assets/greenCircle.png"/></td>
								<td>{this.props.stats.numCorrect}/{numStudents} correct</td>
							</tr>
							<tr >
								<td><img src="../assets/redCircle.png"/></td>
								<td>{this.props.stats.numIncorrect}/{numStudents} incorrect</td>
							</tr>
							<tr>
								<td><img src="../assets/grayCircle.png"/></td>
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
 * 		- "name": student's name
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
      studentName.push(cur.name);

      /* See if this student has bingo */
      var leaderBoardPos = -1;
      for (var j=0; j < this.props.leaderBoard.length; j++) {
        if (this.props.leaderBoard[j] == this.props.studentAnswers[i].deviceID) {
          leaderBoardPos = j;
        }
      }
      if (leaderBoardPos != -1) {
        studentName.push(<img src="../assets/blankBingoChip.png" width="25px" height="25px"/>);
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
				<AllAnswers allQuestionsByStudent={this.props.allQuestionsByStudent} sortBy={this.state.sortBy} allQuestionsByQuestion={this.props.allQuestionsByQuestion}/>
				<div className="outlineButton" onClick={this.props.onEndGame}>
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
				if (totalQuestionsAnswered == 0) {
					table.push(
						<tr>
					    	<td className="studentNamePast">{cur.name}</td>
					    	<td className="fractionScore unanswered">0/0</td> 
					  		<td className="percentageScore unanswered">–</td> 
					 	</tr>
					);
				} else if (percentage >= 50) {
					table.push(
						<tr>
					    	<td className="studentNamePast">{cur.name}</td>
					    	<td className="fractionScore correctAnswer">{curStats["numCorrect"]}/{totalQuestionsAnswered}</td> 
					  		<td className="percentageScore correctAnswer">{percentage}%</td> 
					 	</tr>
					);
				} else {
					table.push(
						<tr>
						    <td className="studentNamePast">{cur.name}</td>
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
 */
var ResultsTable = React.createClass({
	render: function() {
		/* Put all answers in table header header */
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
  			table.push(
  				<tr>
  					<td className="studentNameColumn resultsTableCell">{currStudentInfo.name}</td>
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

ReactDOM.render(
	<TeacherView url="/api/teacher" pollInterval={2000}/>,
	document.getElementById('content')
);
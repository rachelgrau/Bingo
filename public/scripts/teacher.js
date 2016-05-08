/* State
 * -------
 * cards (array): an array of all the questions/answers. Gets shuffled at beginning, then doesn't change
 * indexOfCurrQuestion (int): the index of the current question in the cards array 
 * responsesForStudents (array): array of all the repsonses to sent to students
 * 		- array of dictionaries mapping device ids to individualized responses
 * 		- each response has:
 * 				- nextQuestion (string): the current question
 * 				- approvedBingo (boolean): whether the student has bingo
 * 				- incorrectCardId (int): 
 * 				- correctCardId (int): 
 * currentQuestionAnswers (array): array of the students' answers to the current question. Each dictionary in the array contains:
 * 		- "name" (string): student's name
 * 		- "answer" (string): the student's answer, or "" if no answer yet
 *		- "isCorrect" (boolean): whether the student's answer was correct, or false if still hasn't answered
 * currentQuestionStats (dictionary): the stats for the current question overall
 *		- "numCorrect" (int): # of students that have gotten this question correct
 * 		- "numIncorrect" (int): # of students that have gotten this question incorrect
 * 		- "numUnanswered" (int): # of students that have not yet answered this question incorrect
 *		- "totalStudents" (int): total # of students
 */
var TeacherView = React.createClass({
	getInitialState: function() {
		return {
			cards:[], 
			indexOfCurrQuestion: 0,
			currentQuestionAnswers: [],
			currentQuestionStats: [],
			responsesForStudents: []
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
    		/* Update state! */
    		if (this.state.cards.length == 0) {
    			var cards = this.shuffleCards(data["cards"]); 
    			this.state.cards = cards;   		
    		}
	    	var currentQuestionAnswers = this.getCurrentAnswers(data["studentResponses"]);
	    	var currentQuestionStats = this.getCurrentStats(data["studentResponses"]);
	    	this.setState({
	      		currentQuestionAnswers: currentQuestionAnswers,
	      		currentQuestionStats: currentQuestionStats
	      	});
	      }.bind(this),
	      error: function(xhr, status, err) {
	        console.error(this.props.url, status, err.toString());
	      }.bind(this)
	    });
  	},
  	componentDidMount: function() {
    	this.loadCardsFromServer();
    	setInterval(this.loadCardsFromServer, this.props.pollInterval);
  	},
  	/* Called when the teacher clicks "next question"
  	   increments the index of the current question */
  	handleNextQuestion: function() {
  		/* TO DO: save all student responses here into past questions */
  		var indexOfNextQuestion = this.state.indexOfCurrQuestion + 1;
  		/* Clear current question answers and stats */
  		var currentAnswers = [];
  		for (var i=0; i < this.state.currentQuestionAnswers.length; i++) {
  			var curStudentAnswer = {};
  			curStudentAnswer["name"] = this.state.currentQuestionAnswers[i].name;
  			curStudentAnswer["answer"] =  "";
  			curStudentAnswer["isCorrect"] = false;
  			currentAnswers.push(curStudentAnswer);
  		}
  		var stats = {
  			"numCorrect": 0,
  			"numIncorrect": 0,
  			"numUnanswered": this.state.currentQuestionAnswers.length,
  			"totalStudents": this.state.currentQuestionAnswers.length
  		};
  		this.setState({
	      	indexOfCurrQuestion: indexOfNextQuestion,
	      	currentQuestionAnswers: currentAnswers,
	      	currentQuestionStats: stats
	     });
  	},
  	/*
  	 * Given the student responses from the API, this method returns an array of the student answers
  	 * with 1 dictionary per student, where each dictionary contains "name" "answer" and "isCorrect"
  	 * (What this.state.currentQuestionAnswers should be)
  	 */
  	getCurrentAnswers: function (studentResponses) {
  		var answers = [];
  		for (var i=0; i < studentResponses.length; i++) {
  			// var curStudentAnswer = this.state.studentAnswers[i];
  			var curStudentAnswer = {};
  			curStudentAnswer["name"] = studentResponses[i].name;
  			curStudentAnswer["answer"] =  studentResponses[i].answer;
  			curStudentAnswer["isCorrect"] = (studentResponses[i].answer == this.state.cards[this.state.indexOfCurrQuestion].answer);
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
  			var answer =  studentResponses[i].answer;
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
		return (
			<div className="teacherContent">
				<CurrentQuestion question={currentQuestion} answer={currentAnswer} canPressNext={canPressNext} indexOfCurrentQuestion={this.state.indexOfCurrQuestion} numTotalQuestions={this.state.cards.length} studentAnswers={this.state.currentQuestionAnswers} currentStats={this.state.currentQuestionStats} handleNextQuestion={this.handleNextQuestion}/>
				<PastQuestions />
			</div>
		);
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
				<CurrentQuestionAnswers studentAnswers={this.props.studentAnswers}/>
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
		return (
			<div className="questionAnswer">
				<div className="question">
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
				<div className="graphVisual">Visual</div>
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
 */
var CurrentQuestionAnswers = React.createClass({
	render: function() {
		var table = [];
		/* Loop over and add table entry for each student answer */
		for (var i=0; i < this.props.studentAnswers.length; i++) {
			var cur = this.props.studentAnswers[i];	
			if (cur.answer == "") {
				/* Question still unanswered */
				table.push(
					<tr>
						<td className="studentName">{cur.name}</td>
					    <td className="tableAnswer unanswered">–</td> 
					  	<td className="emptyColumn"></td>
					</tr>
				);
			} else if (cur.isCorrect) {
				/* Question correct*/
				table.push(
					<tr>
						<td className="studentName">{cur.name}</td>
					    <td className="tableAnswer correctAnswer">{cur.answer}</td> 
					  	<td className="emptyColumn"></td>
					</tr>
				);
			} else {
				/* Question incorrect */
				table.push(
					<tr>
						<td className="studentName">{cur.name}</td>
					    <td className="tableAnswer incorrectAnswer">{cur.answer}</td> 
					  	<td className="emptyColumn"></td>
					</tr>
				);
			}
		}
		return (
			<table className="simpleTable">
				<tbody>
				  <tr className="tableHeader">
				    <th className="tableHeader studentName">Student</th>
				    <th className="tableHeader tableAnswer">Answer</th> 
				    <th className="tableHeader"></th>
				  </tr>
				  {table}
			  </tbody>
			</table>
		);
	}
});

var PastQuestions = React.createClass({
	render: function() {
		return (
			<div className="pastQuestions">
				<h1> All questions sorted by: student </h1>
				<hr color="#06AAFF"/>
				<AllAnswers studentAnswers={this.props.studentAnswers}/>
				<div className="outlineButton">
					End game
				</div>
			</div>
		);
	}
});

var AllAnswers = React.createClass({
	render: function() {
		var table = [];
		table.push(<tr>
				    <td className="studentNamePast">Ricky</td>
				    <td className="fractionScore correctAnswer">1/1</td> 
				    <td className="percentageScore correctAnswer">100%</td> 
				  </tr>);
		table.push(<tr>
				    <td className="studentNamePast">Alex</td>
				    <td className="fractionScore unanswered">0/0</td> 
				  	<td className="percentageScore unanswered">–</td> 
				  </tr>);
		table.push(<tr>
				    <td className="studentNamePast">Daniel</td>
				    <td className="fractionScore incorrectAnswer">0/1</td> 
				  	<td className="percentageScore incorrectAnswer">0%</td> 				  
				  </tr>);
		return (
			<table className="simpleTable">
				<tbody>
				  
				  {table}
			  </tbody>
			</table>
		);
	}
});

ReactDOM.render(
	// <ContentTool cards={cards} />,
	<TeacherView url="/api/teacher" pollInterval={2000}/>,
	document.getElementById('content')
);
/* State
 * -------
 * cards (array): an array of all the questions/answers. Gets shuffled at beginning, then doesn't change
 * indexOfCurrQuestion (int): the index of the current question in the cards array 
 */
var TeacherView = React.createClass({
	getInitialState: function() {
		return {
			cards:[], 
			indexOfCurrQuestion: 0
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
    			this.setState({
	      			cards: cards
	      		});
    		}	      	
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
  		this.setState({
	      	indexOfCurrQuestion: indexOfNextQuestion
	     });
  	},
  	render: function() {
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
				<CurrentQuestion question={currentQuestion} answer={currentAnswer} canPressNext={canPressNext} handleNextQuestion={this.handleNextQuestion}/>
				<PastQuestions/>
			</div>
		);
	}
});

/*
 * Props
 * -----
 * question (string): the current question
 * answer (string): the current answer
 * canPressNext (boolean): true if the "Next question" button should be active, false otherwise
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
				<h1> Current question: 1/26 </h1>
				<hr color="#06AAFF"/>
				<QuestionAnswer question={this.props.question} answer={this.props.answer}/>
				<Graph/>
				<div className={nextButtonClass} id="nextQuestion" onClick={this.pressedNext}>
					Next question
				</div>
				<CurrentQuestionAnswers/>
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

var Graph = React.createClass({
	render: function() {
		return (
			<div className="graph">
				<div className="graphVisual">Visual</div>
				<div className="graphStats">
					<table className="statsTable">
						<tbody>
							<tr>
								<td><img src="../assets/greenCircle.png"/></td>
								<td>3/8 correct</td>
							</tr>
							<tr >
								<td><img src="../assets/redCircle.png"/></td>
								<td>4/8 incorrect</td>
							</tr>
							<tr>
								<td><img src="../assets/grayCircle.png"/></td>
								<td>3/8 unanswered</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		);
	}
});

var CurrentQuestionAnswers = React.createClass({
	render: function() {
		return (
			<table className="simpleTable">
				<tbody>
				  <tr className="tableHeader">
				    <th className="tableHeader studentName">Student</th>
				    <th className="tableHeader tableAnswer">Answer</th> 
				    <th className="tableHeader"></th>
				  </tr>
				  <tr>
				    <td className="studentName">Ricky</td>
				    <td className="tableAnswer correctAnswer">Blatant</td> 
				  	<td className="emptyColumn"></td>
				  </tr>
				  <tr>
				    <td className="studentName">Alex</td>
				    <td className="tableAnswer unanswered">–</td> 
				  	<td className="emptyColumn"></td>
				  </tr>
				  <tr>
				    <td className="studentName">Daniel</td>
				    <td className="tableAnswer incorrectAnswer">Wrath</td> 
				  	<td className="emptyColumn"></td>
				  </tr>
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
				<AllAnswers/>
				<div className="outlineButton">
					End game
				</div>
			</div>
		);
	}
});

var AllAnswers = React.createClass({
	render: function() {
		return (
			<table className="simpleTable">
				<tbody>
				  <tr>
				    <td className="studentNamePast">Ricky</td>
				    <td className="fractionScore correctAnswer">1/1</td> 
				    <td className="percentageScore correctAnswer">100%</td> 
				  </tr>
				  <tr>
				    <td className="studentNamePast">Alex</td>
				    <td className="fractionScore unanswered">0/0</td> 
				  	<td className="percentageScore unanswered">–</td> 
				  </tr>
				  <tr>
				    <td className="studentNamePast">Daniel</td>
				    <td className="fractionScore incorrectAnswer">0/1</td> 
				  	<td className="percentageScore incorrectAnswer">0%</td> 				  </tr>
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
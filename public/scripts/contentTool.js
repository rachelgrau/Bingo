// var cards = [
//   {id: 1, answer: "Blatant", question: "Brazenly obvious; flagrant; offensively noisy or loud", completed: "true"},
//   {id: 2, answer: "Abate", question: "To reduce in amount, degree, intensity, etc", completed: "true"},
//   {id: 3, answer: "", question: "", completed: "false"},
//   {id: 4, answer: "", question: "", completed: "false"},
//   {id: 5, answer: "", question: "", completed: "false"},
//   {id: 6, answer: "", question: "", completed: "false"},
//   {id: 7, answer: "", question: "", completed: "false"},
//   {id: 8, answer: "", question: "", completed: "false"},
//   {id: 9, answer: "", question: "", completed: "false"},
//   {id: 10, answer: "", question: "", completed: "false"},
//   {id: 11, answer: "", question: "", completed: "false"},
//   {id: 12, answer: "", question: "", completed: "false"},
//   {id: 13, answer: "", question: "", completed: "false"},
//   {id: 14, answer: "", question: "", completed: "false"},
//   {id: 15, answer: "", question: "", completed: "false"},
//   {id: 16, answer: "", question: "", completed: "false"},
//   {id: 17, answer: "", question: "", completed: "false"},
//   {id: 18, answer: "", question: "", completed: "false"},
//   {id: 19, answer: "", question: "", completed: "false"},
//   {id: 20, answer: "", question: "", completed: "false"},
//   {id: 21, answer: "", question: "", completed: "false"},
//   {id: 22, answer: "", question: "", completed: "false"},
//   {id: 23, answer: "", question: "", completed: "false"},
//   {id: 24, answer: "", question: "", completed: "false"}
// ];

var ContentTool = React.createClass({
	loadCardsFromServer: function() {
    $.ajax({
	      url: this.props.url,
	      dataType: 'json',
	      cache: false,
	      success: function(cards) {
	        this.setState({cards: cards});
	      }.bind(this),
	      error: function(xhr, status, err) {
	        console.error(this.props.url, status, err.toString());
	      }.bind(this)
	    });
  	},
  	getInitialState: function() {
		return {cards:[]};
	},
  	componentDidMount: function() {
    	this.loadCardsFromServer();
    	setInterval(this.loadCardsFromServer, this.props.pollInterval);
  	},
	render: function() {
		return (
			<div className="contentTool">
				<Editor />
				<BingoBoard cards={this.state.cards}/>
				<Footer />
			</div>
		);
	}
});

var Editor = React.createClass({
	render: function() {
		return (
			<div className="editor">
				<form className="bingoCardForm">
					<QuestionBox />
					<AnswerBox />
					<DoneButton />
				</form>
			</div>
		);
	}
});

var QuestionBox = React.createClass({
	render: function() {
		return (
			<div className="questionBox">
				Question:
				<br />
				<input className="editorInput" type="text" placeholder="Enter question" />
			</div>
		);
	}
});

var AnswerBox = React.createClass({
	render: function() {
		return (
			<div className="answerBox">
				Answer:
				<br />
				<input className="editorInput" type="text" placeholder="Enter answer" />
			</div>
		);
	}
});

var DoneButton = React.createClass({
	render: function() {
		return (
			<input className="button blueButtonInactive" id="editorButton" type="submit" value="Done" disabled/>
		);
	}
});

var BingoBoard = React.createClass({
	render: function() {
		var bingoCards = []; // will become array of bingo card components
		/* add a bingo card component for every card with a word */
		for (var i=0; i < this.props.cards.length; i++) {
			var currAnswer = this.props.cards[i].answer;
			var isCompleted = this.props.cards[i].completed;
			if (i==Math.floor(this.props.cards.length/2)) {
				/* Bingo wild card */
				bingoCards.push(<BingoCard answer="WILD" completed="true" isWild="true"/>);
			}
			if (isCompleted=="true") {	
				bingoCards.push(<BingoCard answer={currAnswer} completed="true" isWild="false"/>);
			} else {
				bingoCards.push(<BingoCard answer="" completed="false" isWild="false"/>);
			}
		}		
		return (
			<div className="bingoBoard">
				{bingoCards}
			</div>
		);
	}
});

var BingoCard = React.createClass({
	render: function() {
		if (this.props.isWild == "true") {
			/* Wild card */
			return (
				<div className="bingoCard bingoCardEntered">
					<img src="nearpodIcon.png" className="wildCardImage"/>
				</div>
			);
		} else if (this.props.completed == "false") {
			return (
				<div className="bingoCard bingoCardEmpty">
					{this.props.answer}
				</div>
			);
		} else {
			return (
				<div className="bingoCard bingoCardEntered">
					{this.props.answer}
				</div>
			);
		}
	}
});

var Footer = React.createClass({
	render: function() {
		return (
			<div id="footer">
				<div id="footerButtons">
    				<input className="button footerButton greenButtonActive" id="footerSaveButton" type="submit" value="Save & Exit" />
    				<input className="button footerButton blueButtonInactive" id="footerCreateButton" type="submit" value="Create" disabled/>
    			</div>
    		</div>
		);
	}
});

ReactDOM.render(
	// <ContentTool cards={cards} />,
	<ContentTool url="/api/comments" pollInterval={2000}/>,
	document.getElementById('content')
);
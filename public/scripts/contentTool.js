/*
 * State for the content tool: the cards themselves, and the # of the card that is currently selected (or -1) if none
 */
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
		return {cards:[], selectedCard:-1};
	},
  	componentDidMount: function() {
    	this.loadCardsFromServer();
  	},
  	handleCardSubmit: function(card) {
  		/* Update state[cards]: edited card should contain new question/answer */
  		/* Update state[selectedCard] -- no longer have a card selected */
  		var cardToUpdate = this.state.cards[this.state.selectedCard];
  		cardToUpdate["question"] = card.question;
  		cardToUpdate["answer"] = card.answer;
  		if (!card.question && !card.answer) {
  			cardToUpdate["completed"] = "false";
  		} else {
  			cardToUpdate["completed"] = "true";
  		}
  		this.state.cards[this.state.selectedCard] = cardToUpdate;
  		this.setState({selectedCard: -1});
  	},
  	handleSaveBoard: function(card) {
  		/* TO DO: save all cards from current state to server */
  		$.ajax({
	      url: this.props.url,
	      dataType: 'json',
	      type: 'POST',
	      data: card,
	      success: function(cards) {
	        this.setState({cards: cards});
	      }.bind(this),
	      error: function(xhr, status, err) {
	        console.error(this.props.url, status, err.toString());
	      }.bind(this)
	    });	
  	},
  	handleSelectCard: function(cardNumber) {
  		/* Called when the user clicks on one of the cards. */
  		if (this.refs.myEditor) {
  			this.refs.myEditor.changedSelection();
  		}
  		this.setState({selectedCard: cardNumber});
  	},
	render: function() {
		if (this.state.selectedCard == -1) {	
			return (
				<div className="contentTool">
					<Editor onCardSubmit={this.handleCardSubmit} isSelected="false"/>
					<BingoBoard cards={this.state.cards} onSelectCard={this.handleSelectCard}/>
					<Footer />
				</div>
			);
		} else {
			return (
				<div className="contentTool">
					<Editor ref="myEditor" onCardSubmit={this.handleCardSubmit} isSelected="true" card={this.state.cards[this.state.selectedCard]}/>
					<BingoBoard cards={this.state.cards} onSelectCard={this.handleSelectCard} selectedCard={this.state.selectedCard}/>
					<Footer />
				</div>
			);
		}
	}
});

var Editor = React.createClass({
	getInitialState: function () {
		return {question:'', answer:'', hasChangedQuestion: 'false', hasChangedAnswer: 'false', canSubmit: 'true'};
	},
	handleQuestionChange: function(e) {
		this.setState({question: e.target.value});
		this.setState({hasChangedQuestion: 'true'});
	},
	handleAnswerChange: function(e) {
		this.setState({answer: e.target.value});
		this.setState({hasChangedAnswer: 'true'});
	},
	changedSelection: function() {
    	this.setState(this.getInitialState());
  	},
	handleSubmit: function(e) {
	    e.preventDefault();
	    var question = this.state.question.trim();
	    var answer = this.state.answer.trim();

	    if (this.state.hasChangedQuestion == 'false') {
	    	question = this.props.card.question;
	    }
	    if (this.state.hasChangedAnswer == 'false') {
	    	answer = this.props.card.answer;
	    }

	    /* If question AND answer are empty, that's fine--they can press done and it will go back to being an empty card. 
	    Otherwise, if only one is empty, don't let them press done. */

	    if (!question && !answer) {

	    } else if (!question) {
	    	return;
	    } else if (!answer) {
	    	return; 
	    }

	    this.props.onCardSubmit({question:question, answer:answer});
	    this.setState({question: '', answer: '', hasChangedQuestion: 'false', hasChangedAnswer: 'false'});
	  },
	render: function() {
		if (this.props.isSelected=="true") {
			/* If they've already edited, use state, otherwise use props passed in (currently saved question/answer for the currently selected card). */
			var question = this.state.question;
			var answer = this.state.answer;
			if (this.state.hasChangedQuestion == 'false') {
				question = this.props.card.question;
			}
			if (this.state.hasChangedAnswer == 'false') {
				answer = this.props.card.answer;
			}
			return (
				<div className="editor">
					<form className="bingoCardForm" onSubmit={this.handleSubmit}>
						<div className="questionBox">
							<input className="editorInput" type="text" placeholder="Enter question" value={question} onChange={this.handleQuestionChange}/>
						</div>
						<div className="answerBox">
							<input className="editorInput" type="text" placeholder="Enter answer" value={answer} onChange={this.handleAnswerChange} />
						</div>
						<DoneButton isActive={this.state.canSubmit} />
					</form>
				</div>
			);
		} else {
			return (
				<div className="editor">
					<div className="editorText">
					Select any tile to edit the question and answer associated with it.
					</div>
				</div>
			);
		}
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

var BingoBoard = React.createClass({
	handleCardClicked: function(cardNumber) {
		/* Tell content tool component that card with |cardNumber| was selected */
		this.props.onSelectCard(cardNumber);
	},
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
			if (this.props.selectedCard == i) {
				bingoCards.push(<BingoCard isSelected="true" index={i} answer={currAnswer} completed="true" isWild="false" onCardClick={this.handleCardClicked}/>);
			} else if (isCompleted=="true") {	
				bingoCards.push(<BingoCard isSelected="false" index={i} answer={currAnswer} completed="true" isWild="false" onCardClick={this.handleCardClicked}/>);
			} else {
				bingoCards.push(<BingoCard  isSelected="false" index={i} answer="" completed="false" isWild="false" onCardClick={this.handleCardClicked}/>);
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
	handleClick: function(e) {
		this.props.onCardClick(this.props.index);
	},
	render: function() {
		if (this.props.isWild == "true") {
			/* Wild card */
			return (
				<div className="bingoCard bingoWildCard">
					<img src="nearpodIcon.png" className="wildCardImage"/>
				</div>
			);
		} else if (this.props.isSelected == "true") {
			return (
				<div className="bingoCard bingoCardSelected" onClick={this.handleClick}>
					{this.props.answer}
				</div>
			);
		} else if (this.props.completed == "false") {
			return (
				<div className="bingoCard bingoCardEmpty" onClick={this.handleClick}>
					{this.props.answer}
				</div>
			);
		} else {
			return (
				<div className="bingoCard bingoCardEntered" onClick={this.handleClick}>
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
    				<input className="button footerButton blueButtonInactive" id="footerCreateButton" type="submit" value="Create"/>
    			</div>
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
		if (this.props.isActive == "true") {
			return (
				<input className="button blueButtonActive" id="editorButton" type="submit" value="Done"/>
			);
		} else {
			return (
				<input className="button blueButtonInactive" id="editorButton" type="submit" value="Done"/>
			);
		}
	}
});

ReactDOM.render(
	// <ContentTool cards={cards} />,
	<ContentTool url="/api/comments" pollInterval={2000}/>,
	document.getElementById('content')
);
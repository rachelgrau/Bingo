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
  	/* Update state[cards]: edited card should contain new question/answer */
  	/* Update state[selectedCard] -- no longer have a card selected */
  	handleCardSubmit: function(card) {
  		var cardToUpdate = this.state.cards[this.state.selectedCard];
  		cardToUpdate["question"] = card.question;
  		cardToUpdate["answer"] = card.answer;
  		if (!card.question && !card.answer) {
  			/* The card is empty */
  			cardToUpdate["completed"] = false;
  		} else {
  			cardToUpdate["completed"] = true;
  		}
  		this.state.cards[this.state.selectedCard] = cardToUpdate;
  		/* TO DO: If at some point we want to provide a "next" button, change this to update selectedCard to be this.state.selectedCard + 1 */
  		this.setState({selectedCard: -1}); 
	 
  	},
  	/* Called when the user clicks on one of the cards, changing their current selection. */
  	handleSelectCard: function(cardNumber) {
  		if (this.refs.myEditor) {
  			/* Tell the editor that the selection has been changed. */
  			this.refs.myEditor.changedSelection();
  		}
  		this.setState({selectedCard: cardNumber});
  	},
  	handleCreate: function() {
  	},
  	handleSave: function() {
  		/* TO DO: save all cards (this.state.cards) from current state to server */
  		console.log(this.state.cards);
  		$.ajax({
	      url: this.props.url,
	      dataType: 'json',
	      type: 'POST',
	      data: this.state.cards,
	      success: function(cards) {
	        this.setState({cards: this.state.cards});
	        // console.log(cards);
	      }.bind(this),
	      error: function(xhr, status, err) {
	        console.error(this.props.url, status, err.toString());
	      }.bind(this)
	    });
		console.log("handle save");
  	},
	render: function() {
		if (this.state.selectedCard == -1) {	
			return (
				<div className="contentTool">
					<Editor onCardSubmit={this.handleCardSubmit} isSelected={false}/>
					<BingoBoard cards={this.state.cards} onSelectCard={this.handleSelectCard}/>
					<Footer onCreate={this.handleCreate} onSave={this.handleSave} />
				</div>
			);
		} else {
			return (
				<div className="contentTool">
					<Editor ref="myEditor" onCardSubmit={this.handleCardSubmit} isSelected={true} card={this.state.cards[this.state.selectedCard]}/>
					<BingoBoard cards={this.state.cards} onSelectCard={this.handleSelectCard} selectedCard={this.state.selectedCard}/>
					<Footer onCreate={this.handleCreate} onSave={this.handleSave} cards={this.state.cards}/>
				</div>
			);
		}
	}
});

var Editor = React.createClass({
	/* The state represents what's currently in the question/answer box, not what is currently saved for this card as the question/answer. 
	 * One exception: at the very start, before the user edits question/answer for this card, state thinks question/answer = "". We know 
	 * this is occurring when hasChangedQuestion = hasChangedAnswer = false (at this point, use props to tell what is actually question/answer)
	 */
	getInitialState: function () {
		return {question:'', answer:'', hasChangedQuestion: false, hasChangedAnswer: false, canSubmit: true};
	},
	handleQuestionChange: function(e) {
		this.setState({hasChangedQuestion: true, question: e.target.value});
	},
	handleAnswerChange: function(e) {
		this.setState({hasChangedAnswer: true, answer: e.target.value});
	},
	changedSelection: function() {
    	this.setState(this.getInitialState());
  	},
	handleSubmit: function(e) {
	    e.preventDefault();
	    if (!this.canPressDone()) {
	    	return;
	    }
	    var question = this.getCurrentQuestion();
	    var answer = this.getCurrentAnswer();
	    this.props.onCardSubmit({question:question, answer:answer});
	    this.setState({question: '', answer: '', hasChangedQuestion: false, hasChangedAnswer: false});
	  },
	/* Returns whatever is currently in the question input field. */
	getCurrentQuestion: function() {
		var question = this.state.question;
		/* If they haven't changed question, use props (saved value for this card) */
	    if (!this.state.hasChangedQuestion) {
	    	question = this.props.card.question;
	    }
	    return question;
	},
	canPressDone: function() {
	 	/* If question AND answer are empty, that's fine--they can press done and it will go back to being an empty card. 
	    Otherwise, if only one is empty, don't let them save. */
	 	var question = this.getCurrentQuestion();
	    var answer = this.getCurrentAnswer();
	    if (!question && !answer) {
	    	return true;
	    } else if (!question) {
	    	return false;
	    } else if (!answer) {
	    	return false;
	    } else {
	    	return true;
	    }
	 },
	/* Returns whatever is currently in the answer input field. */
	getCurrentAnswer: function() {
		var answer = this.state.answer;
		/* If they haven't changed answer, use props (saved value for this card) */
	    if (!this.state.hasChangedAnswer) {
	    	answer = this.props.card.answer;
	    }
	    return answer;
	},
	render: function() {
		if (this.props.isSelected) {
			/* If they've already edited, use state, otherwise use props passed in (currently saved question/answer for the currently selected card). */
			var question = this.getCurrentQuestion();
			var answer = this.getCurrentAnswer();
			var isActive = this.canPressDone();
			return (
				<div className="editor">
					<form className="bingoCardForm" onSubmit={this.handleSubmit}>
						<div className="questionBox">
							Question:
							<textArea className="editorInput" type="text" value={question} onChange={this.handleQuestionChange}/>
						</div>
						<div className="answerBox">
							Answer (On-Tile):
							<textArea className="editorInput" type="text" value={answer} onChange={this.handleAnswerChange} />
						</div>
						<DoneButton isActive={isActive} />
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
				bingoCards.push(<BingoCard answer="WILD" completed={true} isWild={true}/>);
			}
			if (this.props.selectedCard == i) {
				bingoCards.push(<BingoCard isSelected={true} index={i} answer={currAnswer} completed={true} isWild={false} onCardClick={this.handleCardClicked}/>);
			} else if (isCompleted) {	
				bingoCards.push(<BingoCard isSelected={false} index={i} answer={currAnswer} completed={true} isWild={false} onCardClick={this.handleCardClicked}/>);
			} else {
				bingoCards.push(<BingoCard  isSelected={false} index={i} answer="" completed={false} isWild={false} onCardClick={this.handleCardClicked}/>);
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
		if (this.props.isWild) {
			/* Wild card */
			return (
				<div className="bingoCard bingoWildCard">
					<img src="../assets/nearpodIcon.png" className="wildCardImage"/>
				</div>
			);
		} else if (this.props.isSelected) {
			return (
				<div className="bingoCard bingoCardSelected" onClick={this.handleClick}>
					<div className="centeredText">{this.props.answer}</div>
				</div>
			);
		} else if (!this.props.completed) {
			return (
				<div className="bingoCard bingoCardEmpty" onClick={this.handleClick}>
					{this.props.answer}
				</div>
			);
		} else {
			return (
				<div className="bingoCard bingoCardEntered" onClick={this.handleClick}>
					<div className="centeredText">{this.props.answer}</div>
				</div>
			);
		}
	}
});

var Footer = React.createClass({
	handleSave: function(e) {
	    e.preventDefault();
	    this.props.onSave();
	},
	handleCreate: function(e) {
		e.preventDefault();
	    this.props.onCreate();
	},
	render: function() {
		return (
			<div id="footer">
				<div id="footerButtons">
    				<input className="button footerButton greenButtonActive" id="footerSaveButton" type="submit" value="Save & Exit" onClick={this.handleSave}/>
    				<input className="button footerButton blueButtonInactive" id="footerCreateButton" type="submit" value="Create" onClick={this.handleCreate}/>
    			</div>
    		</div>
		);
	}
});

var DoneButton = React.createClass({
	render: function() {
		if (this.props.isActive) {
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
	<ContentTool url="/api/contentTool" pollInterval={2000}/>,
	document.getElementById('content')
);
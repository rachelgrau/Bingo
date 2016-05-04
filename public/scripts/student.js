/* State
 * -------
 * cards (array): an array of this students bingo cards, in the order that they appear on his/her board.
 * question (string): the current question, or "" if none.
 * modalType (string): the type of modal to display, or "" if none. Should be set to something before chanign isModalOpen to true.
 * isModalOpen (boolean): whether or not a modal is currently being displayed.
 * selectedCardIndex (int): when a student clicks on a card, this holds the index in |cards| of the card they selected. Default value is -1 (no selection)
 * readyForNextQuestion (boolean): false until the student answers the current question, then becomes true. When a new question arrives, turns to false again unitl they answer.
 * numBingoChecksLeft (int): the number of chances this student has left to check if they have bingo. Starts at 3. 
 * hasBingo (boolean): false until the student gets bingo correctly!
 */
var StudentView = React.createClass({
	/* Dummy function that will be eventually done on teacher side. 
	   Tells you if you have bingo or not. */
	hasBingo: function(cards) {
		return true;
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
	/* Returns true if the student currently has bingo (based on where 
	   their chips are placed, and not whether the chips were placed 
	   correctly), and false if bingo is not possible with current chip 
	   layout */
	bingoButtonShouldActivate: function() {
		var numPerRow = Math.sqrt(this.state.cards.length + 1);
		var wildCardRow = Math.floor(numPerRow/2);
		/* Check horizontal */
		for (var row=0; row<numPerRow; row++) {
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
					currRowHasBingo = false;
					break;
				}
			}
			if (currRowHasBingo) return true;
		}

		/* Check vertical */
		var wildCardIndex = Math.floor(this.state.cards.length/2);
		for (var col=0; col<numPerRow; col++) {
			var currColHasBingo = true; 
			for (var row=0; row<numPerRow; row++) {
				/* Check col i */
				currIndex = col + (row*numPerRow);
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
		}

		/* Check diagonal from top left to bottom right corners */
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

		/* Check diagonal from top right to bottom left corners */
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

		return false;
	},
	loadCardsFromServer: function() {
    $.ajax({
	      url: this.props.url,
	      dataType: 'json',
	      cache: false,
	      success: function(data) {
	      	var cards = this.shuffleCards(data["cards"]);
	      	this.setState({question: data["question"], cards: cards});
	      }.bind(this),
	      error: function(xhr, status, err) {
	        console.error(this.props.url, status, err.toString());
	      }.bind(this)
	    });
  	},
  	getInitialState: function() {
		return {
			cards:[], 
			question:"", 
			modalType:"", 
			isModalOpen: false, 
			selectedCardIndex: -1, 
			readyForNextQuestion: false,
			numBingoChecksLeft: 3,
			hasBingo: false
		};
	},
	/* Called when they place a chip on a card */
	handleClickedCard: function(cardIndex) {
		this.state.selectedCardIndex = cardIndex;
		this.openModal("confirmChipPlacement");
	},
  	componentDidMount: function() {
    	this.loadCardsFromServer();
  	},
  	/* The app uses one shared modal, so we open & close it as needed and just change its inner content.
  	 * modalType (string): the type of modal you want to open
  	 */
  	openModal: function(modalType) {
        this.setState({modalType: modalType, isModalOpen: true});
    },
    /* Called when the user clicks "yes" to close the modal. Check what the curent modal type is and act accordingly.
     * "confirmChipPlacement": place a chip on the card they selected
     * "checkBingo": check if they have bingo
     * "skip": don't place any chips, just become ready for next question
     */
    closeModalAccept: function() {
    	switch(this.state.modalType) {
    		case "confirmChipPlacement":
        		/* Place the chip */
    			var cards = this.state.cards;
				cards[this.state.selectedCardIndex]["hasChip"] = true;
				this.bingoButtonShouldActivate();
        		this.setState({cards: cards, isModalOpen: false, modalType:"", selectedCardIndex: -1, readyForNextQuestion: true});
       			break;
    		case "checkBingo":
    			/* Check if they have bingo */
    			if (this.hasBingo()) {
    				var numBoardChecksLeft = this.state.numBingoChecksLeft - 1;
    				this.setState({hasBingo: true, numBingoChecksLeft: numBoardChecksLeft, isModalOpen: false, modalType:"", selectedCardIndex: -1, readyForNextQuestion: true});
    				this.openModal("youGotBingo");
    			} else {

    			}
        		break;
        	case "skip":
        		/* Ready for next question */
        		this.setState({isModalOpen: false, modalType:"", selectedCardIndex: -1, readyForNextQuestion: true});
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
    			this.setState({isModalOpen: false, modalType:"", selectedCardIndex: -1});
        		break;
        	case "skip":
        		this.setState({isModalOpen: false, modalType:"", selectedCardIndex: -1});
        		break;
        	case "youGotBingo":
        		this.setState({isModalOpen: false, modalType:"", selectedCardIndex: -1});
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
  	render: function() {
  		var hasBingo = this.bingoButtonShouldActivate();

  		/* If the user just selected a card, figure out what the word was so we
  		   can display it in modal */
  		var selectedCardWord = "";
  		if (this.state.selectedCardIndex != -1) {
  			selectedCardWord = this.state.cards[this.state.selectedCardIndex].word;
  		}
  		/* If the student is currently waiting for the next question, then don't respond
  		   to any clicks on cards */
  		var canSelectCard = !this.state.readyForNextQuestion;
		return (
			<div className="studentView ">
				<Header/>
				<div className="studentContent"> 
					<div className="leftBar">
						<Question question={this.state.question} readyForNextQuestion={this.state.readyForNextQuestion} onSkip={this.handleSkipQuestion}/>
						<BingoChecker hasBingo={hasBingo} onBingoClicked={this.handleBingoClicked} numBingoChecksLeft={this.state.numBingoChecksLeft} gotBingo={this.state.hasBingo}/>
					</div>
					<BingoBoard cards={this.state.cards} handleClickedCard={this.handleClickedCard} clicksEnabled={canSelectCard}/>
				</div>
				<Modal modalType={this.state.modalType} isOpen={this.state.isModalOpen} question= {this.state.question} answer={selectedCardWord} onAccept={this.closeModalAccept} onCancel={this.closeModalCancel} numBingoChecksLeft={this.state.numBingoChecksLeft}/>
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
			return (
				<div className="questionBox">
					Question:
					<div className="questionCard" id="questionCardId">
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
 */
var BingoChecker = React.createClass ({
	render: function() {
		if (this.props.gotBingo) {
			return (
				<div className="bingoChecker">
    				<div className="button grayButtonInactive" onClick={this.props.onBingoClicked}>
						I have bingo!
					</div><br/>
					<div className="textDisabled">Board checks left: <b>{this.props.numBingoChecksLeft}</b></div>
				</div>
			);
		} else if (this.props.hasBingo) {
			return (
				<div className="bingoChecker">
	    			<div className="button blueButtonShadow" onClick={this.props.onBingoClicked}>
						I have bingo!
					</div><br/>
					Board checks left: <b>{this.props.numBingoChecksLeft}</b>
				</div>
			);
		} else {
			return (
				<div className="bingoChecker">
    				<div className="button grayButtonInactive">
						I have bingo!
					</div><br/>
					Board checks left: <b>3</b>
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
			var word = card.word;
			if (i==Math.floor(this.props.cards.length/2)) {
				/* Bingo wild card */
				bingoCards.push(<BingoCard isWild={true} word=""/>);
			}	
			bingoCards.push(<BingoCard index={i} isWild={false} word={word} hasChip={card["hasChip"]} handleClick={this.handleClickedCard}/>);
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
				<div className="bingoCard">
					<div className="verticallyCenteredText"><img src="../assets/nearpodIcon.png" width="43" height="36" className="wildCardImage"/></div>
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
 *
 * Props
 * -----
 * isOpen (boolean): if true, then displays the modal; otherwise doesn't
 * modalType (string): the type of modal (see above)
 * question (string): if the modal is type "confirmChipPlacement", then this prop is the question the student is trying to answer
 * answer (string): if the modal is type "confirmChipPlacement", then this prop is the card the student just selected
 * numBingoChecksLeft (int): the the number of bingo checks they have left 
 * onCancel (function): the callback for when student clicks "cancel" button (regardless of modal type)
 * onAccept (function): the callback for when student clicks "yes" button (regardless of modal type)
 */
var Modal = React.createClass({
    render: function() {
        if(this.props.isOpen){
        	if (this.props.modalType == "confirmChipPlacement") {
        		return (
	                <div className="modalBg">
	                  <div className="modal">
	              			Are you sure you want to place this chip?<br/>
	              			<div id="questionAnswerContainer">
	              				<div className="questionSmall"><div className="verticallyCenteredText">{this.props.question}</div></div>
	              				<div className="answerSmall"><div className="verticallyCenteredText">{this.props.answer}</div></div>
	              			</div>
	              			<div className="modalFooter">
	              				<div id="twoButtonContainer">
									<div className="modalButton blueButton" id="leftModalButton" onClick={this.props.onCancel}>No, go back.</div>
									<div className="modalButton outlineButton" id="rightModalButton" onClick={this.props.onAccept}>Yes, make selection.</div>
								</div>
							</div>
	              		</div>
	                </div>
            	);
        	} else if (this.props.modalType == "skip") {
        		return (
	                <div className="modalBg">
	                  <div className="modal">
	              			Are you sure you want to skip?<br/>
	              			<div id="questionOnlyContainer">
	              				<div className="questionSmall"><div className="verticallyCenteredText">{this.props.question}</div></div>
	              			</div>
	              			<div className="modalFooter">
	              				<div id="twoButtonContainer">
									<div className="modalButton blueButton" id="leftModalButton" onClick={this.props.onCancel}>No, go back.</div>
									<div className="modalButton outlineButton" id="rightModalButton" onClick={this.props.onAccept}>Yes, skip.</div>
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
									<div className="modalButton blueButton" id="leftModalButton" onClick={this.props.onCancel}>No, go back.</div>
									<div className="modalButton outlineButton" id="rightModalButton" onClick={this.props.onAccept}>Yes, I want to check.</div>
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


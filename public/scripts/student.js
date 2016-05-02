var StudentView = React.createClass({
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
		return {cards:[], question:"", isModalOpen: false, selectedCardIndex: -1};
	},
	/* Called when they place a chip on a card */
	handleClickedCard: function(cardIndex) {
		this.state.selectedCardIndex = cardIndex;
		this.openModal();
	},
  	componentDidMount: function() {
    	this.loadCardsFromServer();
  	},
  	/* The app uses one shared modal, so we open & close it as needed and 
  	   just change its inner content */
  	openModal: function() {
        this.setState({isModalOpen: true});
    },
    /* Called when the user clicks "yes" to close the modal; places a bingo chip */
    closeModalAccept: function() {
    	/* Place the chip */
    	var cards = this.state.cards;
		cards[this.state.selectedCardIndex]["hasChip"] = true;
		this.bingoButtonShouldActivate();
        this.setState({cards: cards, isModalOpen: false, selectedCardIndex: -1});
    },
    /* Called when the user clicks "no" to close the modal */
    closeModalCancel: function() {
    	this.setState({isModalOpen: false, selectedCardIndex: -1});
    },
  	render: function() {
  		var hasBingo = this.bingoButtonShouldActivate();

  		/* If the user just selected a card, figure out what the word was so we
  		   can display it in modal */
  		var selectedCardWord = "";
  		if (this.state.selectedCardIndex != -1) {
  			selectedCardWord = this.state.cards[this.state.selectedCardIndex].word;
  		}
		return (
			<div className="studentView ">
				<Header/>
				<div className="studentContent"> 
					<div className="leftBar">
						<Question question={this.state.question}/>
						<BingoChecker hasBingo={hasBingo}/>
					</div>
					<BingoBoard cards={this.state.cards} handleClickedCard={this.handleClickedCard}/>
				</div>
				<Modal modalType="confirmChipPlacement" isOpen={this.state.isModalOpen} question= {this.state.question} answer={selectedCardWord} onAccept={this.closeModalAccept} onCancel={this.closeModalCancel}/>
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

var Question = React.createClass({
	render: function() {
		if (this.props.question) {
			return (
				<div className="questionBox">
					Question:
					<div className="questionCard" id="questionCardId">
						{this.props.question}
						</div>
					<div className="button outlineButton" id="skipButton">
						Skip
					</div>
				</div>
			);
		} else {
			return (
				<div className="questionBox">
					Waiting for next question...
				</div>
			);
		}
	}
});

var BingoChecker = React.createClass ({
	render: function() {
		if (this.props.hasBingo) {
			return (
				<div className="bingoChecker">
    			<div className="button blueButtonShadow">
					I have bingo!
				</div><br/>
				Board checks left: <b>3</b>
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

var BingoBoard = React.createClass ({
	handleClickedCard: function(cardIndex) {
		this.props.handleClickedCard(cardIndex);
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
					<img src="../assets/nearpodIcon.png" width="43" height="36" className="wildCardImage"/>
				</div>
			);
		} else  {
			var chipClassName = "bingoCard";
			if (this.props.hasChip) chipClassName += " bingoChipCard";
			return (
				<div className={chipClassName} onClick={this.handleClick}>
					{this.props.word}
				</div>
			); 
		}
	}
});

/* Modal types 
 * -------------
 * confirmChipPlacement: "Are you sure you want to place this chip" + yes/no buttons 
 */
var Modal = React.createClass({
    render: function() {
        if(this.props.isOpen){
        	if (this.props.modalType == "confirmChipPlacement") {
        		return (
	                <div className="modalBg">
	                  <div className="modal">
	              			Are you sure you want to place this chip?<br/>
	              			<div id="boxContainer">
	              				<div className="questionSmall"> {this.props.question}</div>
	              				<div className="answerSmall"> {this.props.answer}</div>
	              			</div>
	              			<div className="modalFooter">
	              				<div id="buttonContainer">
									<div className="modalButton blueButton" id="leftModalButton" onClick={this.props.onCancel}>No, go back.</div>
									<div className="modalButton outlineButton" id="rightModalButton" onClick={this.props.onAccept}>Yes, make selection.</div>
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


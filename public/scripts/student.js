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
		return {cards:[], question:""};
	},
	/* Called when they place a chip on a card */
	handleClickedCard: function(cardIndex) {
		var cards = this.state.cards;
		cards[cardIndex]["hasChip"] = true;
		this.setState({cards: cards});

		// this.state.data["cards"][cardIndex] = card;
	},
  	componentDidMount: function() {
    	this.loadCardsFromServer();
  	},
  	render: function() {
		return (
			<div className="studentView ">
				<Header/>
				<div className="studentContent"> 
					<div className="leftBar">
						<Question question={this.state.question}/>
						<BingoChecker hasBingo={true}/>
					</div>
					<BingoBoard cards={this.state.cards} handleClickedCard={this.handleClickedCard}/>
				</div>
			</div>
		);
	}
});

var Header = React.createClass ({
	render: function() {
		return (
			<div className="header">
				Bingo Header
			</div>
		);
	}
});

var Question = React.createClass({
	render: function() {
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
	}
});

var BingoChecker = React.createClass ({
	render: function() {
		if (this.props.hasBingo) {
			return (
				<div className="bingoChecker">
    			<div className="button grayButtonInactive">
					I have bingo!
				</div><br/>
				Board checks left: <b>3</b>
			</div>
			);
		} else {
			return (
				<div className="bingoChecker">
    			<div className="button blueButtonActive">
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
		this.props.handleClick(this.props.index);
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

ReactDOM.render(
	// <ContentTool cards={cards} />,
	<StudentView url="/api/student" pollInterval={2000}/>,
	document.getElementById('content')
);


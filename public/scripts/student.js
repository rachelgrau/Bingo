var StudentView = React.createClass({
	loadCardsFromServer: function() {
    $.ajax({
	      url: this.props.url,
	      dataType: 'json',
	      cache: false,
	      success: function(data) {
	        this.setState({data: data});
	      }.bind(this),
	      error: function(xhr, status, err) {
	        console.error(this.props.url, status, err.toString());
	      }.bind(this)
	    });
  	},
  	getInitialState: function() {
		return {data:[]};
	},
  	componentDidMount: function() {
    	this.loadCardsFromServer();
  	},
  	render: function() {
		return (
			<div className="studentView ">
				<Header/>
				<div className="leftBar">
					<Question/>
					<BingoChecker/>
				</div>
				<BingoBoard />
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
					Brazenly obvious; flagrant; offensively noisy or loud 
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
		return (
			<div className="bingoChecker">
    			<div className="button grayButton">
					I have bingo!
				</div><br/>
				Board checks left: 3
			</div>
		);
	}
});

var BingoBoard = React.createClass ({
	render: function() {
		var bingoCards = []; // will become array of bingo card components
		/* add a bingo card component for every card with a word */
		for (var i=0; i < 25; i++) {
			var currAnswer =  "Hi";
			bingoCards.push(<BingoCard/>);
		}		
		return (
			<div className="bingoBoard">
				{bingoCards}
			</div>
		);
	}
});

var BingoCard = React.createClass ({
	render: function() {
		return (
			<div className="bingoCard">
				Hey
			</div>
		);
	}
});

ReactDOM.render(
	// <ContentTool cards={cards} />,
	<StudentView url="/api/student" pollInterval={2000}/>,
	document.getElementById('content')
);


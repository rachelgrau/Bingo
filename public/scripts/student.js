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
			<div className="testDiv">
				Question
			</div>
		);
	}
});

var BingoChecker = React.createClass ({
	render: function() {
		return (
			<div className="testDiv">
				Bingo Checker
			</div>
		);
	}
});

var BingoBoard = React.createClass ({
	render: function() {
		return (
			<div className="bingoBoard">
				Bingo Board
			</div>
		);
	}
});

ReactDOM.render(
	// <ContentTool cards={cards} />,
	<StudentView url="/api/student" pollInterval={2000}/>,
	document.getElementById('content')
);


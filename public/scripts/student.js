var ContentTool = React.createClass({

});


ReactDOM.render(
	// <ContentTool cards={cards} />,
	<ContentTool url="/api/comments" pollInterval={2000}/>,
	document.getElementById('content')
);
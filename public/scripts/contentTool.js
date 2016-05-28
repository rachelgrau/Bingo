var NUM_CARDS = 24;
var debug = true;
/*
 * POSTS to API when the user hits "create" or "save & exit" -- 
 * 		completed: this.state.isCompleted
 * 		title: this.state.title
 * 		data_all: this.state.dataStudent // doesn't have the answer
 *		data_teacher: this.state.cards
 * 
 * State 
 * ------
 * cards (array): the cards themselves as they will be sent to the teacher
 * dataStudent (array): the cards as they will be sent to the student
 * selectedCard (int): the index of the card that is currently selected (or -1) if none
 * isCompleted (boolean): whether or not the current slide has been "created" 
 * slideID (int): the ID of this slide, or 0 if it's new
 * jwt (string): taken from URL
 * presentationID (int): taken from URL 
 * isExiting (boolean): true as soon as the user hits "Save & Exit" or "Create"; false otherwise
 */

var presentationId = "118814";
// var jwt = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJDVCIsImV4cCI6MTQ2MzY4NTk0MiwiYXVkIjoiN2RhYmFjNjQ2ODFhN2MxMmMxY2I5NzE4M2M0NGRlOTMiLCJyZWZyZXNoIjo3MjAwLCJ0a24iOiIiLCJ1aWQiOiIiLCJpYXQiOjE0NjM2Nzg3NDIsImlkIjoiMTYwMTciLCJlbnYiOiJodHRwczpcL1wvY3QtZGV2Lm5lYXJwb2QuY29tXC8ifQ.lJOA4cwX8ogQwm_R4WvlOO-QtlP0dlaqI_tupyZYGaE";

var ContentTool = React.createClass({
	/* Returns a dictionary of all the variables in the URL */
	getUrlVars: function() {
	    var vars = {};
	    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
	        vars[key] = value;
	    });
	    return vars;
	},
	/* Returns a header dictionary with the App ID and JWT in the header */
	setHeaders: function(){
		if (debug) console.log("Setting JWT: " + this.state.jwt);
		return {"x-api-key":"7dabac64681a7c12c1cb97183c44de93", "JWT": this.state.jwt};
	},

	showError: function(json){
		alert("error: " + json.error_code + "\nmessage: " + json.message + "\n\nfull: " + JSON.stringify(json) );
	},

	showSuccess: function(json){
		alert("code: " + json.error_code + "\nmessage: " + json.message + "\n\nfull: " + JSON.stringify(json) );
	},
	/* 
	 * Callback for when GET request succeeds.
	 * Updates the state to hold the cards returned by the GET request. 
	 */
	handleGetSuccess: function(data, textStatus, jqXHR) {
		if (debug) console.log("Get succeeded");
		var cards = data.payload.custom_slide.data_teacher;
		if (cards.length == 0) {
			if (debug) console.log("No cards returned, so creating initial cards");
		    cards = this.getInitialCards();
		}	    
		this.setState({
		    cards: cards,
		    isCompleted: data.completed
		});	
	},
	/* 
	 * Callback for when POST request succeeds.
	 * Grabs the slide ID from the response and updates the state's slide ID.
	 */
	handlePostSuccess: function(data, textStatus, jqXHR) {
		if (debug) console.log("Post succeeded");
		var slideID = jqXHR.responseJSON.payload.custom_slide.id;
		if (debug) console.log("Returned slide ID: " + slideID);
		this.setState({slideID: slideID});
	},
	/* 
	 * Callback for when PUT request succeeds.
	 */
	handlePutSuccess: function(data, textStatus, jqXHR) {
		if (debug) console.log("Put succeeded");
	},
	/* If this is an existing slide, loads the cards from the API with a GET request.
	   Otherwise, creates a new slide by posting (blank cards) to the API, and displays blank cards. */
	loadCardsFromServer: function() {
		var params = "";
		if (this.state.slideID > 0) {
			/* GET: we are editing an existing slide. */
			// this.get("custom_slides/" + this.state.slideID, "", this.handleGetSuccess);
		} else {
			/* POST: we need to make a new slide with 24 blank cards */
			var newCards = this.getInitialCards();
			this.state.cards = newCards;
			this.updateCardsForStudent();
			params = {
				"presentation_id": this.state.presentationID,
				"completed": this.state.isCompleted,
				"title": this.state.title,
				"data_all": this.state.dataStudent,
				"data_teacher": this.state.cards
			};
			// this.post("custom_slides", params, this.handlePostSuccess);
			this.setState({
				cards: this.state.cards,
				dataStudent: this.state.dataStudent
			});
		}
  	},
  	/* Performs a GET request. 
  	 * path (string): the URL path (e.g. "custom_slides/3") 
  	 * params: (probably empty string for GET request)
  	 * successCallback (function): function that gets called when the GET request succeeds. Passed the data, textStatus, and jqXHR
  	 */
	get: function(path, params, successCallback){
		if (debug) console.log("Making GET request with path: " + path);
		$.ajax({
			  url: "https://api-dev.nearpod.com/v1/ct/" + path,
			  method: "GET",
			  async: false,
			  data: params,
			  headers: this.setHeaders(),
			  success: function(data, textStatus, jqXHR){		      			  
				successCallback(data, textStatus, jqXHR);
			  },
			  error: function(jqXHR, textStatus, errorThrown){
				  this.showError(jqXHR.responseJSON);
			  }
		});
	},
  	/* Performs a POST request. 
  	 * path (string): the URL path (e.g. "custom_slides") 
  	 * params (dictionary): dictionary of params, including "presentation_id," "completed," "title," "data_all," "data_teacher"
  	 * successCallback (function): function that gets called when the POST request succeeds. Passed the data, textStatus, and jqXHR
  	 */
	post: function(path, params, successCallback){
		if (debug) console.log("Making POST request with path: " + path);		
		if (debug) console.log("Params: ");
		if (debug) console.log(params);
		$.ajax({
			  url: "https://api-dev.nearpod.com/v1/ct/" + path,
			  method: "POST",
			  async: false,
			  data: JSON.stringify(params),
			  headers: this.setHeaders(),
			  success: function(data, textStatus, jqXHR){
				  successCallback(data, textStatus, jqXHR);
			  },
			  error: function(jqXHR, textStatus, errorThrown){
				  this.showError(jqXHR.responseJSON);
			  }
		});
	},
    /* Performs a PUT request. 
  	 * path (string): the URL path (e.g. "custom_slides/3") 
  	 * params (dictionary): dictionary of params, including "completed," "title," "data_all," "data_teacher"
  	 * successCallback (function): function that gets called when the PUT request succeeds. Passed the data, textStatus, and jqXHR
  	 */
	put: function(path, params, successCallback){
		if (debug) console.log("Making PUT request with path: " + path);		
		$.ajax({
		  url: "https://api-dev.nearpod.com/v1/ct/" + path,
		  method: "PUT",
		  async: false,
		  data: JSON.stringify(params),
		  headers: this.setHeaders(),
		  success: function(data, textStatus, jqXHR){
			  successCallback(data, textStatus, jqXHR);
		  },
		  error: function(jqXHR, textStatus, errorThrown){
			  showError(jqXHR.responseJSON);
		  }
		});	
	},
  	getInitialState: function() {
  		var urlVars = this.getUrlVars();
  		//TO DO: presentation ID will also come from here
		return {
			cards:[], 
			dataStudent: [],
			selectedCard:-1,
			isCompleted: false,
			title: "", 
			numCardsCompleted: 0,
			slideID: urlVars["id"],
			jwt: urlVars["jwt"],
			presentationID: urlVars["presentation_id"],
			isExiting: false
		};
	},
	/* Returns an array of 24 empty cards (teacher cards) */
	getInitialCards: function() {
		var cards = [];
		for (var i=0; i < NUM_CARDS; i++) {
			var card = {};
			card["id"] = i;
			card["answer"] = "";
			card["question"] = "";
			card["completed"] = false;
			cards.push(card);
 		}	
 		return cards;
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
  	/* Updates this.state.dataStudent to contain all the cards in this.state.cards, but wihtout 
  	   the "answer" field and with a "hasChip" (false) and "teacherApproved" (false) field */
  	updateCardsForStudent: function() {
  		var studentCards = [];
  		for (var i=0; i < this.state.cards.length; i++) {
  			var currentCard = this.state.cards[i];
  			var studentCard = {};
  			studentCard["id"] = currentCard.id;
  			studentCard["answer"] = currentCard.answer;
  			studentCard["hasChip"] = false;
  			studentCard["teacherApproved"] = false;
  			studentCards.push(studentCard);
  		}
  		this.state.dataStudent = studentCards;
  	},
  	/* Called when the user clicks "create."" If create button is inactive, do nothing. 
  	   Otherwise, set completed to true, set up dataStudent, and do a PUT request to API. */
  	handleCreate: function() {
  		var createButtonClass = $("#footerCreateButton").attr('class');
  		if (createButtonClass == "button footerButton blueButtonActive") {
  			this.updateCardsForStudent();
  			this.state.isCompleted = true;
  			this.state.isExiting = true;
  			var params = {
				"presentationId": presentationId,
				"completed": this.state.isCompleted,
				"title": this.state.title,
				"data_all": this.state.dataStudent,
				"data_teacher": this.state.cards
			};
			this.put("custom_slides/" + this.state.slideID, params, this.handlePutSuccess);
			if (debug) console.log("going back");
			window.history.back();
  		}
  	},
  	/* Called when the user clicks "save and exit." Saves current state of all cards by doing
  	   a PUT request. */
  	handleSave: function() {
  		this.updateCardsForStudent();
  		this.state.isExiting = true;
		var params = {
				"presentation_id": presentationId,
				"completed": this.state.isCompleted,
				"title": this.state.title,
				"data_all": this.state.dataStudent,
				"data_teacher": this.state.cards
		};
		this.put("custom_slides/" + this.state.slideID, params, this.handlePutSuccess);
		if (debug) console.log("going back");
		window.history.back();
  	},
  	handleOpenSettings: function() {
  		console.log("settings opened");
  	},
  	/* Returns true when all the cards are filled out, meaning this slide can be marked as completed. 
  	 * Returns false otherwise (if not all 24 cards are filled out). */
  	createButtonShouldActivate: function() {
  		/* Count up any completed cards */
  		if (this.state.isExiting) return false;
	    var numCardsCompleted = 0;
	    for (var i=0; i < this.state.cards.length; i++) {
	      	if (this.state.cards[i].completed) {
	      		numCardsCompleted++;
	      	}
	    }
	    if (numCardsCompleted == NUM_CARDS) return true;
	    else return false; 
  	},
	render: function() {
		var createButtonActivated = this.createButtonShouldActivate();
		var saveButtonActivated = !this.state.isExiting;
		if (this.state.selectedCard == -1) {	
			return (
				<div>
					<Header onSettingsClicked={this.handleOpenSettings}/>
					<div className="content">
						<Editor onCardSubmit={this.handleCardSubmit} isSelected={false}/>
						<BingoBoard cards={this.state.cards} onSelectCard={this.handleSelectCard}/>
						<Footer createButtonActivated={createButtonActivated} saveButtonActivated={saveButtonActivated} onCreate={this.handleCreate} onSave={this.handleSave} />
					</div>
				</div>
			);
		} else {
			return (
				<div>
					<Header />
					<div className="content">
						<Editor ref="myEditor" onCardSubmit={this.handleCardSubmit} isSelected={true} card={this.state.cards[this.state.selectedCard]}/>
						<BingoBoard cards={this.state.cards} onSelectCard={this.handleSelectCard} selectedCard={this.state.selectedCard}/>
						<Footer createButtonActivated={createButtonActivated} onCreate={this.handleCreate} onSave={this.handleSave}/>
					</div>
				</div>
			);
		}
	}
});

/*
 * Props
 * -----
 * onSettingsClicked (function): callback that will get called when the user clicks the settings button
 */
var Header = React.createClass({
	render: function() {
		return(
			<div id="header">
        		<img id="headerImage" src="assets/bingoIcon.png"/>
       			<span className="headerText">Bingo</span>
       			<div id="settingsButton" onClick={this.props.onSettingsClicked}>
       				<img id="settingImg" src="assets/settings_dark_gray.png"/>
       			</div>
      		</div>
		);
	}
});

/*
 * Props
 * -----
 * onCardSubmit (function): callback that will get called when the user presses "Done" 
 * isSelected (boolean): true if a card is currently selected to be edited, and false if no card is selected
 * card (dictionary): the card that is currently being edited. It holds the question & answer as they are currently saved on the board (NOT how they appear in the editor necessarily)
 * 
 * State
 * -----
 * question (string): the current question to display in the box (NOT what's currently saved as question); one exception=to start out, it's "" even if props gave us a question
 * answer (string): the current answer to display in the box (NOT what's currently saved as answer); one exception=to start out, it's "" even if props gave us an answer
 * hasChangedQuestion (boolean): false until the user edits the question in any way. If this is false, then we know to display the props value for the question and not the state value
 * hasChangedAnswer (boolean): false until the user edits the answer in any way. If this is false, then we know to display the props value for the answer and not the state value
 * canSubmit (boolean): whether or not the "Done" button should be activated 
 * 
 */
var Editor = React.createClass({
	/* The state represents what's currently in the question/answer box, not what is currently saved for this card as the question/answer. 
	 * One exception: at the very start, before the user edits question/answer for this card, state thinks question/answer = "". We know 
	 * this is occurring when hasChangedQuestion = hasChangedAnswer = false (at this point, use props to tell what is actually question/answer)
	 */
	getInitialState: function () {
		return {
			question:'', 
			answer:'', 
			hasChangedQuestion: false, 
			hasChangedAnswer: false, 
			canSubmit: true
		};
	},
	handleQuestionChange: function(e) {
		this.setState({
			hasChangedQuestion: true, 
			question: e.target.value
		});
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

/*
 * Props
 * -----
 * cards (array): array of all the cards to display
 * onSelectCard (function): function that should get called when the user clicks on a card. Pass it the index of the card that was selected
 * selectedCard (int): if a card is currently selected, the index of that card (excluding wild card)...otherwise -1
 * 
 */
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

/*
 * Props
 * -----
 * isSelected (boolean): true if the card should appear as selected, false otehrwise
 * completed (boolean): true if the current card has been completed (i.e. has an answer), false if it's empty
 * isWild (boolean): true if this is the wild card, false otherwise
 * index (int): the index of this card on the board (excluding wild card) from top left to bottom right 
 * answer (string): the answer to display on the card
 * onCardClick (function): callback that should get called when this card is selected...pass it the index of this card
 */
var BingoCard = React.createClass({
	handleClick: function(e) {
		this.props.onCardClick(this.props.index);
	},
	render: function() {
		if (this.props.isWild) {
			/* Wild card */
			return (
				<div className="bingoCard bingoWildCard">
					<img src="assets/nearpodIcon.png" className="wildCardImage"/>
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

/*
 * Props
 * -----
 * onSave (function): callback that should get called when the user clicks save
 * onCreate (function): callback that should get called when the user clicks create
 * createButtonActivated (boolean): true if the create button should be activated, false otherwise
 * saveButtonActivated (boolean): true if the save button should be activated, false otherwise
 */
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
		var createButtonClass = "button footerButton ";
		var saveButtonClass = "button footerButton ";
		if (this.props.createButtonActivated) {
			createButtonClass += "blueButtonActive";
		} else {
			createButtonClass += "blueButtonInactive";
		}
		if (this.props.saveButtonActivated) {
			saveButtonClass += "greenButtonActive";
		} else {
			saveButtonClass += "greenButtonInactive";
		}

		return (
			<div id="footer">
				<div id="footerButtons">
    				<input className={saveButtonClass} id="footerSaveButton" type="submit" value="Save & Exit" onClick={this.handleSave}/>
    				<input className={createButtonClass} id="footerCreateButton" type="submit" value="Create" onClick={this.handleCreate}/>
    			</div>
    		</div>
		);
	}
});

/*
 * Props
 * -----
 * isActive (boolean): true when the done button should be clickable; false otherwise
 */
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

var height = $(document).height();
parent.postMessage({"type":"change_iframe_height", "height":"674px"}, '*');
	
ReactDOM.render(
	<ContentTool url="/api/contentTool" pollInterval={2000}/>,
	document.getElementById('bingoContentTool')
);
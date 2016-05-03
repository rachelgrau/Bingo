[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

# Bingo

 This project will eventually hold the content tool, student, and teacher views for Nearpod Bingo. 
 Right now, you can view the project by running the simple server included (it's not yet connected to API) and visiting <http://localhost:3000/>. From there, you will find links to the content tool, student, and teacher views.

# Current State of Project

Test in Google Chrome for now (working on other browsers). 

Content tool: We have a rough/buggy version of the content tool up. When you open it up in a browser, you'll see that 2 words get loaded in as samples ("Abate" and "Blatant"); this data comes from contentToo.json (feel free to edit and play around with it). Although we read in the initial data to display from students.json using a local server, the data you enter is not yet stored persistently or connected to the Nearpod API–it's just UI. You can enter new cards and edit the existing ones, but they won't save on the server yet. 

Student view: We also have a rough/buggy view of the student view up. Right now, like with the content tool, we load in data to display from students.json, but don't yet store/save any data. So, you'll see a shuffled board and the first question, and you can answer that question (but it won't be saved on the server). Feel free to edit the question and any of the cards that will appear on the student's board by editing students.json. You can also add a field "hasChip: true" to any of the cards in student.json to make it appear as though a student has already placed a chip on that card. Note that when you answer a question & place a chip, it will say "waiting for the next question" forever; eventually, the teacher will control moving onto the next question, but we have not implemented this yet. 

Teacher view: not yet implemented :) 

## To use -- quick instructions (prior experience)

To run the project, open up a terminal window, enter the directory for this project, and then start the ruby server (assuming you have ruby downloaded): 

ruby server.rb

Now visit <http://localhost:3000/> and you should see links to the content tool, student, and teacher views.

## To use -- detailed instructions 
1. Download the zip
2. Open a terminal window (the "terminal" application if you're using a mac)
3. type "ls" to see where you currently are in your directory structure. "ls" just prints out all of the files/directories that are in whatever directory you're currently in. You're probably in your home directory so you'll see directories like "Desktop" and "Downloads" 
Assuming the zip folder is still in your Downloads folder, enter the Downloads directory by typing "cd Downloads" (if you moved it somewhere else, enter that directory instead...just type "cd [directory name]" to enter directory)
4. Type "ls" again...this time it will print a list of files/directories that are in your downloads folder...you should see the name of the zip folder you downloaded
5. Enter the project by typing "cd [name of zip folder]" where [name of zip folder] is probably react-tutorial-master or whatever the zip folder is named on your computer
6. Type "ruby server.rb" (no quotes) – if you don't have ruby installed, then this won't work and you'll need to install it (https://www.ruby-lang.org/en/documentation/installation/)
7. Open Google Chrome and visit <http://localhost:3000/>


## Changing the port

You can change the port number by setting the `$PORT` environment variable before invoking any of the scripts above, e.g.,

```sh
PORT=3001 node server.js
```

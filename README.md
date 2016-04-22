[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

# Bingo

 This project will eventually hold the content tool, student, and teacher views for Nearpod Bingo. 
 Right now, you can view the content tool by running the simple server included (it's not yet connected to API) and visiting <http://localhost:3000/>.

# Current State of Project

Right now, we have a rough version of the content tool up. The data you enter is not yet stored in the local server or connected to the Nearpod API–it's just UI and interactivity. When you open it up in a browser, you'll see that 2 words get loaded in as samples ("Abate" and "Blatant"). This is just to test loading in data from the local server, don't worry about it for now.

## To use

There are several simple server implementations included. To run the project, open up a terminal window, enter the directory for this project, and then start a server with one of the following (we are using ruby):

### Node

```sh
npm install
node server.js
```

### Python

```sh
pip install -r requirements.txt
python server.py
```

### Ruby
```sh
ruby server.rb
```

### PHP
```sh
php server.php
```

### Go
```sh
go run server.go
```

### Perl

```sh
cpan Mojolicious
perl server.pl
```

Now visit <http://localhost:3000/> and you should see the content tool with 2 cards entered, abate and blatant. 

## Changing the port

You can change the port number by setting the `$PORT` environment variable before invoking any of the scripts above, e.g.,

```sh
PORT=3001 node server.js
```

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

# Bingo

 This project will eventually hold the content tool, student, and teacher views for Nearpod Bingo. 
 Right now, you can view the content tool by running the simple server included (it's not yet connected to API) and visiting <http://localhost:3000/>.

# Current State of Project

Right now, we have a rough version of the content tool up. The data you enter is not yet stored in the local server or connected to the Nearpod API–it's just UI and interactivity. 

## To use

There are several simple server implementations included. They all serve static files from `public/` and handle requests to `/api/comments` to fetch or add data. Start a server in your terminal with one of the following:

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

And visit <http://localhost:3000/>. Try opening multiple tabs!

## Changing the port

You can change the port number by setting the `$PORT` environment variable before invoking any of the scripts above, e.g.,

```sh
PORT=3001 node server.js
```

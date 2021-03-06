# This file provided by Facebook is for non-commercial testing and evaluation
# purposes only. Facebook reserves all rights not expressly granted.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
# FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
# WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import json
import os
import time
from flask import Flask, Response, request

app = Flask(__name__, static_url_path='', static_folder='public')
app.add_url_rule('/', 'root', lambda: app.send_static_file('index.html'))

@app.route('/api/comments', methods=['GET', 'POST'])
def comments_handler():

    with open('comments.json', 'r') as file:
        comments = json.loads(file.read())

    if request.method == 'POST':
        newComment = request.form.to_dict()
        newComment['id'] = int(time.time() * 1000)
        comments.append(newComment)

        with open('comments.json', 'w') as file:
            file.write(json.dumps(comments, indent=4, separators=(',', ': ')))

    return Response(json.dumps(comments), mimetype='application/json', headers={'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*'})


@app.route('/api/contentTool', methods=['GET', 'POST'])
def content_tool_handler():
    with open('contentTool.json', 'r') as file:
        cards = json.loads(file.read())

    newCards = None

    if request.method == 'POST':
        cardDict = request.form.to_dict()
        cards = cardDict.keys()[0]
        print("printing cards")
        print cards
        with open('contentTool.json', 'w') as file:
            file.write(cards)
            # file.write(json.dumps(cards, indent=4, separators=(',', ': ')))

    return Response(json.dumps(cards), mimetype='application/json', headers={'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*'})

@app.route('/api/student', methods=['GET', 'POST'])
def student_handler():

    with open('student.json', 'r') as file:
        cards = json.loads(file.read())

    # if request.method == 'POST':
    #     newCard = request.form.to_dict()
    #     newCard['id'] = int(time.time() * 1000)
    #     cards.append(newCard)

    #     with open('student.json', 'w') as file:
    #         file.write(json.dumps(cards, indent=4, separators=(',', ': ')))

    return Response(json.dumps(cards), mimetype='application/json', headers={'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*'})

@app.route('/api/teacher', methods=['GET', 'POST'])
def teacher_handler():

    with open('teacher.json', 'r') as file:
        cards = json.loads(file.read())

    # if request.method == 'POST':
    #     newCard = request.form.to_dict()
    #     newCard['id'] = int(time.time() * 1000)
    #     cards.append(newCard)

    #     with open('student.json', 'w') as file:
    #         file.write(json.dumps(cards, indent=4, separators=(',', ': ')))

    return Response(json.dumps(cards), mimetype='application/json', headers={'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*'})



if __name__ == '__main__':
    app.run(port=int(os.environ.get("PORT",3000)))

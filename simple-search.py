#!/usr/bin/env python3
import os
import sqlite3
from flask import Flask
from flask_restful import Api, Resource, reqparse

DB_PATH = os.environ.get("DB_PATH", "/var/www/ghost-search.db")

app = Flask(__name__)
api = Api(app)

class Search(Resource):
  def get(self, term):
    print(f"Search term: '{term}'")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    results = []
    for row in c.execute("SELECT post_id, url, title, excerpt FROM posts WHERE html MATCH ?", (term,)):
      results.append({ "id": row[0], "url": row[1], "title": row[2], "excerpt": row[3] })
    return results, 200

api.add_resource(Search, "/search/<string:term>")
app.run(debug=False)


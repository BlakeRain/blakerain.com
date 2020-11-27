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
        for row in c.execute("SELECT post_id, url, date, image, title, excerpt FROM posts WHERE content MATCH ?", (term,)):
            results.append({"id": row[0], "url": row[1], "date": row[2],
                            "image": row[3], "title": row[4], "excerpt": row[5]})
        print(f"  Found {len(results)} results")
        return results, 200


api.add_resource(Search, "/search/<string:term>")
app.run(debug=False)

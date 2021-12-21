import dependencies

import base64
import boto3
import hashlib
import json
import logging
import os

from cryptography.fernet import Fernet
from datetime import datetime

FERNET_KEY = os.getenv("FERNET_KEY")
if not FERNET_KEY:
    FERNET_KEY = Fernet.generate_key()
else:
    FERNET_KEY = FERNET_KEY.encode("utf-8")
PASSWORD_HASH_ITERATIONS = 100_000
DDB = boto3.client("dynamodb")


def standard_response(status: int, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Pragma": "no-cache",
            "Access-Control-Allow-Origin": "*",
            "Date": datetime.now().strftime("%a, %d %b %Y %H:%M:%S %Z"),
            "Expires": 0,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Strict-Transport-Security": "max-age=31536000, includeSubDomains"
        },
        "body": json.dumps(body)
    }


def validate_token(token: str) -> bool:
    try:
        obj = json.loads(Fernet(FERNET_KEY).decrypt(base64.b64decode(token.encode("utf-8"))))
        res = DDB.get_item(TableName="PageTable", Key={
            "Path": {"S": "user"},
            "Section": {"S": obj["username"]}
        })
        if "Item" not in res or not res["Item"]:
            return False
        return True
    except:
        logging.exception("Error validating authentication token")
        return False


def handle_auth_signin(event):
    body = json.loads(event["body"])
    if "username" not in body:
        return standard_response(400, {"error": "Expected 'username' field in request body"})
    username = body["username"]
    if not isinstance(username, str):
        return standard_response(400, {"error": "Expected 'username' field to be a string"})

    if "password" not in body:
        return standard_response(400, {"error": "Expected 'password' field in request body"})
    password = body["password"]
    if not isinstance(password, str):
        return standard_response(400, {"error": "Expected 'password' field to be a string"})

    res = DDB.get_item(TableName="PageTable", Key={
        "Path": {"S": "user"},
        "Section": {"S": username}
    })

    if "Item" not in res or not res["Item"]:
        return standard_response(403, {"error": "Invalid username or password"})

    salt, _, expected_hash = res["Item"]["Password"]["S"].partition(":")
    salt = base64.b64decode(salt)
    expected_hash = base64.b64decode(expected_hash)
    computed_hash = hashlib.pbkdf2_hmac("sha512", password.encode("utf-8"), salt, PASSWORD_HASH_ITERATIONS)

    if computed_hash != expected_hash:
        return standard_response(403, {"error": "Invalid username or password"})

    token = Fernet(FERNET_KEY).encrypt(json.dumps({"username": username}).encode("utf-8"))
    return standard_response(200, {"token": base64.b64encode(token).decode("utf-8")})


def handle_views_week(event):
    body = json.loads(event["body"])
    if "token" not in body:
        return standard_response(400, {"error": "Expected 'token' field in request body"})
    token = body["token"]
    if not isinstance(token, str):
        return standard_response(400, {"error": "Expected 'token' field to be a string"})

    if not validate_token(token):
        return standard_response(403, {"error": "Invalid authentication token"})

    if "year" not in body:
        return standard_response(400, {"error": "Expected 'year' field in request body"})
    year = body["year"]
    if not isinstance(year, int):
        return standard_response(400, {"error": "Expected 'year' field to be a number"})

    if "week" not in body:
        return standard_response(400, {"error": "Expected 'week' field in request body"})
    week = body["week"]
    if not isinstance(week, int):
        return standard_response(400, {"error": "Expected 'week' field to be a number"})

    res = DDB.query(TableName="PageTable",
                    KeyConditionExpression="#P = :v1 AND begins_with(#S, :v2)",
                    ExpressionAttributeNames={"#P": "Path", "#S": "Section"},
                    ExpressionAttributeValues={
                        ":v1": {"S": "site"},
                        ":v2": {"S": f"Week-{year}-{week}-"}
                    })
    print(res)

    def map_item(item):
        year, _, week = item["ViewWeek"]["S"].partition("-")
        return {
            "year": int(year),
            "week": int(week),
            "day": int(item["ViewDay"]["S"]),
            "count": int(item["ViewCount"]["N"])
        }

    return standard_response(200, [map_item(item) for item in res["Items"]])


def handle_views_month(event):
    body = json.loads(event["body"])
    if "token" not in body:
        return standard_response(400, {"error": "Expected 'token' field in request body"})
    token = body["token"]
    if not isinstance(token, str):
        return standard_response(400, {"error": "Expected 'token' field to be a string"})

    if not validate_token(token):
        return standard_response(403, {"error": "Invalid authentication token"})

    if "year" not in body:
        return standard_response(400, {"error": "Expected 'year' field in request body"})
    year = body["year"]
    if not isinstance(year, int):
        return standard_response(400, {"error": "Expected 'year' field to be a number"})

    if "month" not in body:
        return standard_response(400, {"error": "Expected 'month' field in request body"})
    month = body["month"]
    if not isinstance(month, int):
        return standard_response(400, {"error": "Expected 'month' field to be a number"})

    res = DDB.query(TableName="PageTable",
                    KeyConditionExpression="#P = :v1 AND begins_with(#S, :v2)",
                    ExpressionAttributeNames={"#P": "Path", "#S": "Section"},
                    ExpressionAttributeValues={
                        ":v1": {"S": "site"},
                        ":v2": {"S": f"Month-{year}-{month}-"}
                    })

    def map_item(item):
        year, _, month = item["ViewMonth"]["S"].partition("-")
        return {
            "year": int(year),
            "month": int(month),
            "day": int(item["ViewDay"]["S"]),
            "count": int(item["ViewCount"]["N"])
        }

    return standard_response(200, [map_item(item) for item in res["Items"]])


def handle_browsers_week(event):
    body = json.loads(event["body"])
    if "token" not in body:
        return standard_response(400, {"error": "Expected 'token' field in request body"})
    token = body["token"]
    if not isinstance(token, str):
        return standard_response(400, {"error": "Expected 'token' field to be a string"})

    if not validate_token(token):
        return standard_response(403, {"error": "Invalid authentication token"})

    if "year" not in body:
        return standard_response(400, {"error": "Expected 'year' field in request body"})
    year = body["year"]
    if not isinstance(year, int):
        return standard_response(400, {"error": "Expected 'year' field to be a number"})

    if "week" not in body:
        return standard_response(400, {"error": "Expected 'week' field in request body"})
    week = body["week"]
    if not isinstance(week, int):
        return standard_response(400, {"error": "Expected 'week' field to be a number"})

    res = DDB.query(TableName="PageTable",
                    KeyConditionExpression="#P = :v1 AND begins_with(#S, :v2)",
                    ExpressionAttributeNames={"#P": "Path", "#S": "Section"},
                    ExpressionAttributeValues={
                        ":v1": {"S": "browser"},
                        ":v2": {"S": f"Week-{year}-{week}-"}
                    })
    print(res)

    def map_item(item):
        _, _, browser = item["Section"]["S"].partition("#")
        year, _, week = item["ViewWeek"]["S"].partition("-")
        return {
            "browser": browser,
            "year": int(year),
            "week": int(week),
            "day": int(item["ViewDay"]["S"]),
            "count": int(item["ViewCount"]["N"])
        }

    return standard_response(200, [map_item(item) for item in res["Items"]])


def handle_browsers_month(event):
    body = json.loads(event["body"])
    if "token" not in body:
        return standard_response(400, {"error": "Expected 'token' field in request body"})
    token = body["token"]
    if not isinstance(token, str):
        return standard_response(400, {"error": "Expected 'token' field to be a string"})

    if not validate_token(token):
        return standard_response(403, {"error": "Invalid authentication token"})

    if "year" not in body:
        return standard_response(400, {"error": "Expected 'year' field in request body"})
    year = body["year"]
    if not isinstance(year, int):
        return standard_response(400, {"error": "Expected 'year' field to be a number"})

    if "month" not in body:
        return standard_response(400, {"error": "Expected 'month' field in request body"})
    month = body["month"]
    if not isinstance(month, int):
        return standard_response(400, {"error": "Expected 'month' field to be a number"})

    res = DDB.query(TableName="PageTable",
                    KeyConditionExpression="#P = :v1 AND begins_with(#S, :v2)",
                    ExpressionAttributeNames={"#P": "Path", "#S": "Section"},
                    ExpressionAttributeValues={
                        ":v1": {"S": "browser"},
                        ":v2": {"S": f"Month-{year}-{month}-"}
                    })
    print(res)

    def map_item(item):
        _, _, browser = item["Section"]["S"].partition("#")
        year, _, month = item["ViewMonth"]["S"].partition("-")
        return {
            "browser": browser,
            "year": int(year),
            "month": int(month),
            "day": int(item["ViewDay"]["S"]),
            "count": int(item["ViewCount"]["N"])
        }

    return standard_response(200, [map_item(item) for item in res["Items"]])


def lambda_handler(event, context):
    resource = event["resource"]
    try:
        if resource == "/api/auth/signin":
            return handle_auth_signin(event)
        if resource == "/api/views/week":
            return handle_views_week(event)
        if resource == "/api/views/month":
            return handle_views_month(event)
        if resource == "/api/browsers/week":
            return handle_browsers_week(event)
        if resource == "/api/browsers/month":
            return handle_browsers_month(event)
    except:
        logging.exception(f"Failed to execute request to '{resource}'")
        return standard_response(500, {"error": "Internal server error"})
    return standard_response(404, {"error": "Unrecognized resource"})

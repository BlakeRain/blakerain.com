import dependencies

import base64
import boto3
import functools
import hashlib
import json
import logging
import os

from cryptography.fernet import Fernet
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Tuple

AUTH_KEY = os.getenv("AUTH_KEY")
if not AUTH_KEY:
    AUTH_KEY = Fernet.generate_key()
else:
    AUTH_KEY = AUTH_KEY.encode("utf-8")

TABLE_NAME = os.getenv("TABLE_NAME", "analytics")

PASSWORD_HASH_ITERATIONS = 100_000

DDB = boto3.client("dynamodb")


def standard_response(status: int, body, content_type: str = "application/json"):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": content_type,
            "Pragma": "no-cache",
            "Access-Control-Allow-Origin": "*",
            "Date": datetime.now().strftime("%a, %d %b %Y %H:%M:%S %Z"),
            "Expires": 0,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Strict-Transport-Security": "max-age=31536000, includeSubDomains"
        },
        "body": json.dumps(body) if body is not None else ""
    }


def decode_body_if_valid(body) -> Tuple[bool, Any]:
    if body is None:
        return False, None
    if isinstance(body, str):
        body = body.strip()
        if len(body) > 0:
            return True, json.loads(body)
    if isinstance(body, bytes):
        body = body.strip()
        if len(body) > 0:
            return True, json.loads(body)
    return False, None


class Request:
    def __init__(self, event: Dict[str, Any]):
        self.event = event
        self.reqcxt = event.get("requestContext", {})
        self.http = self.reqcxt.get("http", {})
        # Get the HTTP method from the request. If we can't find one, we can't route.
        self.method: str = self.http.get("method", None)
        if self.method is None:
            logging.error("Cannot find 'method' property in 'requestContext.http'")
            raise Exception("Unable to find 'method' property in 'requestContext.http'")
        self.method = self.method.upper()
        # Get the path that is being requested. If we can't find one, we can't route
        self.path: str = self.http.get("path", None)
        if self.path is None:
            logging.error("Cannot find 'path' property in 'requestContext.http'")
            raise Exception("Unable to find 'path' property in 'requestContext.http'")
        # Get the headers, query string parameters and the request body (if any)
        self.headers: Dict[str, str] = event.get("headers", {})
        self.query: Dict[str, str] = event.get("queryStringParameters", {})
        self.body = None
        if "body" in event:
            try:
                okay, decoded = decode_body_if_valid(event["body"])
                if okay:
                    self.body = decoded
            except:
                logging.exception("Failed to decode JSON request body")
                raise Exception("Failed to decode request JSON")


class Route:
    def __init__(self, method: str, path: str, handler: Callable[[Request], Dict[str, Any]]):
        self.method = method.upper()
        self.path = path
        self.handler = handler


class Router:
    def __init__(self):
        self.routes: List[Route] = []

    def route(self, method: str, path: str):
        def decorator_route(func):
            self.routes.append(Route(method, path, func))

            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                func(*args, **kwargs)
            return wrapper
        return decorator_route

    def find_route(self, request: Request) -> Optional[Route]:
        for route in self.routes:
            if route.method == request.method and route.path == request.path:
                return route
        return None

    def scan_options(self, request: Request) -> str:
        if request.path == "*":
            return "OPTIONS, GET, POST"
        methods = set()
        for route in self.routes:
            if route.path == request.path:
                methods.add(route.method)
        return ", ".join(methods)

    def dispatch(self, event):
        try:
            request = Request(event)
        except Exception as e:
            logging.exception("Failed to parse request")
            return standard_response(400, {"error": f"Failed to parse request: {e}"})

        if request.method == "OPTIONS":
            methods = self.scan_options(request)
            headers = {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }
            if methods:
                headers["Allow"] = methods
                headers["Access-Control-Allow-Methods"] = methods
            return {
                "statusCode": 204,
                "headers": headers
            }

        try:
            route = self.find_route(request)
        except Exception as e:
            logging.exception(f"Exception arose finding route for '{request.method}' request to '{request.path}'")
            return standard_response(500, {"error": "Internal server error"})

        if not route:
            logging.error(f"Failed to route '{request.method}' request to '{request.path}'")
            return standard_response(404, {"error": f"Failed to route '{request.method}' request to '{request.path}'"})

        try:
            res = route.handler(request)
        except:
            logging.exception("Exception arose invoking route handler for "
                              f"'{request.method}' request to '{request.path}'")
            return standard_response(500, {"error": "Internal server error"})

        return res


router = Router()


def validate_token(token: str) -> bool:
    try:
        obj = json.loads(Fernet(AUTH_KEY).decrypt(base64.b64decode(token.encode("utf-8"))))
        res = DDB.get_item(TableName=TABLE_NAME, Key={
            "Path": {"S": "user"},
            "Section": {"S": obj["username"]}
        })
        if "Item" not in res or not res["Item"]:
            return False
        return True
    except:
        logging.exception("Error validating authentication token")
        return False


@router.route("GET", "/pv.gif")
def handle_page_view(request: Request) -> Dict[str, Any]:
    uuid = request.query.get("uuid")
    path = request.query.get("path")
    ua = request.query.get("ua")
    viewport_width = request.query.get("viewport_width")
    viewport_height = request.query.get("viewport_height")
    screen_width = request.query.get("screen_width")
    screen_height = request.query.get("screen_height")
    timezone = request.query.get("tz")
    referrer = request.query.get("referrer")
    duration = request.query.get("duration")
    scroll = request.query.get("scroll")
    if None in [uuid, path]:
        return standard_response(202, None, "image/gif")

    item = {
        "Path": {"S": path},
        "Section": {"S": f"view-{uuid}"},
        "Time": {"S": datetime.now().isoformat()}
    }

    if ua is not None:
        item["UserAgent"] = {"S": ua}
    if viewport_width is not None:
        item["ViewportWidth"] = {"N": viewport_width}
    if viewport_height is not None:
        item["ViewportHeight"] = {"N": viewport_height}
    if screen_width is not None:
        item["ScreenWidth"] = {"N": screen_width}
    if screen_height is not None:
        item["ScreenHeight"] = {"N": screen_height}
    if timezone is not None:
        item["Timezone"] = {"S": timezone}
    if referrer is not None:
        item["Referrer"] = {"S": referrer}
    if duration is not None:
        item["Duration"] = {"N": duration}
    if scroll is not None:
        item["Scroll"] = {"N": scroll}

    DDB.put_item(TableName=TABLE_NAME, Item=item)
    return standard_response(202, None, "image/gif")


@router.route("POST", "/api/auth/signin")
def handle_auth_signin(request: Request) -> Dict[str, Any]:
    if request.body is None:
        return standard_response(400, {"error": "Missing request body"})
    username = request.body.get("username")
    password = request.body.get("password")
    if not isinstance(username, str):
        return standard_response(400, {"error": "Expected 'username' field to be a string"})
    if not isinstance(password, str):
        return standard_response(400, {"error": "Expected 'password' field to be a string"})

    res = DDB.get_item(TableName=TABLE_NAME, Key={
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

    token = Fernet(AUTH_KEY).encrypt(json.dumps({"username": username}).encode("utf-8"))
    return standard_response(200, {"token": base64.b64encode(token).decode("utf-8")})


@router.route("POST", "/api/views/week")
def handle_views_week(request: Request) -> Dict[str, Any]:
    if request.body is None:
        return standard_response(400, {"error": "Missing request body"})
    token = request.body.get("token")
    year = request.body.get("year")
    week = request.body.get("week")
    if not isinstance(token, str):
        return standard_response(400, {"error": "Expected 'token' field to be a string"})
    if not isinstance(year, int):
        return standard_response(400, {"error": "Expected 'year' field to be an integer"})
    if not isinstance(week, int):
        return standard_response(400, {"error": "Expected 'week' field to be an integer"})

    if not validate_token(token):
        return standard_response(403, {"error": "Invalid authentication token"})

    res = DDB.query(TableName=TABLE_NAME,
                    KeyConditionExpression="#P = :v1 AND begins_with(#S, :v2)",
                    ExpressionAttributeNames={"#P": "Path", "#S": "Section"},
                    ExpressionAttributeValues={
                        ":v1": {"S": "site"},
                        ":v2": {"S": f"Week-{year}-{week}-"}
                    })

    def map_item(item):
        year, _, week = item["ViewWeek"]["S"].partition("-")
        return {
            "year": int(year),
            "week": int(week),
            "day": int(item["ViewDay"]["S"]),
            "count": int(item["ViewCount"]["N"])
        }

    return standard_response(200, [map_item(item) for item in res["Items"]])


@router.route("POST", "/api/views/month")
def handle_views_month(request: Request) -> Dict[str, Any]:
    if request.body is None:
        return standard_response(400, {"error": "Missing request body"})
    token = request.body.get("token")
    year = request.body.get("year")
    month = request.body.get("month")
    if not isinstance(token, str):
        return standard_response(400, {"error": "Expected 'token' field to be a string"})
    if not isinstance(year, int):
        return standard_response(400, {"error": "Expected 'year' field to be an integer"})
    if not isinstance(month, int):
        return standard_response(400, {"error": "Expected 'month' field to be an integer"})

    if not validate_token(token):
        return standard_response(403, {"error": "Invalid authentication token"})

    res = DDB.query(TableName=TABLE_NAME,
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


@router.route("POST", "/api/browsers/week")
def handle_browsers_week(request: Request) -> Dict[str, Any]:
    if request.body is None:
        return standard_response(400, {"error": "Missing request body"})
    token = request.body.get("token")
    year = request.body.get("year")
    week = request.body.get("week")
    if not isinstance(token, str):
        return standard_response(400, {"error": "Expected 'token' field to be a string"})
    if not isinstance(year, int):
        return standard_response(400, {"error": "Expected 'year' field to be an integer"})
    if not isinstance(week, int):
        return standard_response(400, {"error": "Expected 'week' field to be an integer"})

    if not validate_token(token):
        return standard_response(403, {"error": "Invalid authentication token"})

    res = DDB.query(TableName=TABLE_NAME,
                    KeyConditionExpression="#P = :v1 AND begins_with(#S, :v2)",
                    ExpressionAttributeNames={"#P": "Path", "#S": "Section"},
                    ExpressionAttributeValues={
                        ":v1": {"S": "browser"},
                        ":v2": {"S": f"Week-{year}-{week}-"}
                    })

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


@router.route("POST", "/api/browsers/month")
def handle_browsers_month(request: Request) -> Dict[str, Any]:
    if request.body is None:
        return standard_response(400, {"error": "Missing request body"})
    token = request.body.get("token")
    year = request.body.get("year")
    month = request.body.get("month")
    if not isinstance(token, str):
        return standard_response(400, {"error": "Expected 'token' field to be a string"})
    if not isinstance(year, int):
        return standard_response(400, {"error": "Expected 'year' field to be an integer"})
    if not isinstance(month, int):
        return standard_response(400, {"error": "Expected 'month' field to be an integer"})

    if not validate_token(token):
        return standard_response(403, {"error": "Invalid authentication token"})

    res = DDB.query(TableName=TABLE_NAME,
                    KeyConditionExpression="#P = :v1 AND begins_with(#S, :v2)",
                    ExpressionAttributeNames={"#P": "Path", "#S": "Section"},
                    ExpressionAttributeValues={
                        ":v1": {"S": "browser"},
                        ":v2": {"S": f"Month-{year}-{month}-"}
                    })

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
    return router.dispatch(event)

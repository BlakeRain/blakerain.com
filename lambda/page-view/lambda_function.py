from datetime import datetime

import boto3
import os

DDB = boto3.client("dynamodb")
DDB_TABLE_NAME = os.getenv("DDB_TABLE_NAME", "PageTable")


def standard_response():
    return {
        "statusCode": 202,
        "headers": {
            "Content-Type": "image/gif",
            "Pragma": "no-cache",
            "Access-Control-Allow-Origin": "*",
            "Date": datetime.now().strftime("%a, %d %b %Y %H:%M:%S %Z"),
            "Expires": "0",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Strict-Transport-Security": "max-age=31536000, includeSubDomains"
        },
        "body": ""
    }


def lambda_handler(event, context):
    query = event["queryStringParameters"]

    if query is None:
        return standard_response()

    uuid = query.get("uuid", None)
    path = query.get("path", None)
    ua = query.get("ua", None)
    viewport_width = query.get("viewport_width", None)
    viewport_height = query.get("viewport_height", None)
    screen_width = query.get("screen_width", None)
    screen_height = query.get("screen_height", None)
    timezone = query.get("tz", None)
    referrer = query.get("referrer", None)
    duration = query.get("duration", None)
    scroll = query.get("scroll", None)
    if None in [uuid, path]:
        return standard_response()

    item = {
        "Path": {"S": path},
        "Section": {"S": f"view-{uuid}"},
        "Time": {"S": datetime.now().isoformat()},
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

    DDB.put_item(TableName=DDB_TABLE_NAME, Item=item)
    return standard_response()

import dependencies

from datetime import datetime

import boto3
import os
import user_agents

DDB = boto3.client("dynamodb")
DDB_TABLE_NAME = os.getenv("DDB_TABLE_NAME", "PageTable")


def update_path(path: str, time: datetime):
    # Store the "day" count for this page
    DDB.update_item(TableName=DDB_TABLE_NAME, Key={
        "Path": {"S": path},
        "Section": {"S": f"Day-{time.strftime('%Y-%m-%dT%H')}"}
    },
        UpdateExpression="SET ViewDay = :d, ViewHour = :h ADD ViewCount :n",
        ExpressionAttributeValues={
        ":d": {"S": time.strftime('%Y-%m-%d')},
        ":h": {"S": str(time.hour)},
        ":n": {"N": "1"}
    })

    # Store the "week" count for this page
    DDB.update_item(TableName=DDB_TABLE_NAME, Key={
        "Path": {"S": path},
        "Section": {"S": f"Week-{time.strftime('%Y-%W-%w')}"}
    },
        UpdateExpression="SET ViewWeek = :w, ViewDay = :d ADD ViewCount :n",
        ExpressionAttributeValues={
        ":w": {"S": time.strftime('%Y-%W')},
        ":d": {"S": time.strftime('%w')},
        ":n": {"N": "1"}
    })

    # Store the "month" count for this page
    DDB.update_item(TableName=DDB_TABLE_NAME, Key={
        "Path": {"S": path},
        "Section": {"S": f"Month-{time.strftime('%Y-%m-%d')}"}
    },
        UpdateExpression="SET ViewMonth = :m, ViewDay = :d ADD ViewCount :n",
        ExpressionAttributeValues={
        ":m": {"S": time.strftime('%Y-%m')},
        ":d": {"S": str(time.day)},
        ":n": {"N": "1"}
    })


def update_user_agent(time: datetime, user_agent_string: str):
    ua = user_agents.parse(user_agent_string)

    DDB.update_item(TableName=DDB_TABLE_NAME, Key={
        "Path": {"S": "browser"},
        "Section": {"S": f"Week-{time.strftime('%Y-%W-%w')}#{ua.browser.family.replace(' ', '-')}"}
    },
        UpdateExpression="SET ViewWeek = :w, ViewDay = :d ADD ViewCount :n",
        ExpressionAttributeValues={
        ":w": {"S": time.strftime("%Y-%W")},
        ":d": {"S": time.strftime("%w")},
        ":n": {"N": "1"}
    })

    DDB.update_item(TableName=DDB_TABLE_NAME, Key={
        "Path": {"S": "browser"},
        "Section": {"S": f"Month-{time.strftime('%Y-%m-%d')}#{ua.browser.family.replace(' ', '-')}"}
    },
        UpdateExpression="SET ViewMonth = :m, ViewDay = :d ADD ViewCount :n",
        ExpressionAttributeValues={
        ":m": {"S": time.strftime("%Y-%m")},
        ":d": {"S": str(time.day)},
        ":n": {"N": "1"}
    })


def lambda_handler(event, context):
    for record in event.get("Records", []):
        if record.get("eventName", None) == "INSERT":
            dynamo = record.get("dynamodb", {})
            keys = dynamo.get("Keys", {})
            path = keys.get("Path", None)
            section = keys.get("Section", None)

            if None in [path, section]:
                continue

            path = path["S"]
            section = section["S"]

            if not path.startswith("/"):
                path = "/" + path

            print(f"Path: '{path}', section: '{section}'")

            if section.startswith("view-"):
                # Get the attributes for the pageview
                image = dynamo.get("NewImage", None)
                if image:
                    time = datetime.fromisoformat(image["Time"]["S"])
                    update_path(path, time)
                    update_path("site", time)
                    update_user_agent(time, image["UserAgent"]["S"])

import boto3


def lambda_handler(event, context):
    for record in event.get("Records", []):
        if record.get("eventName", None) == "INSERT":
            keys = record.get("Keys", {})
            path = keys.get("Path", None)
            section = keys.get("Section", None)
            if None in [path, section]:
                continue

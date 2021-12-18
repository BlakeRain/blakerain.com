from uuid import UUID
from pynamodb.attributes import UTCDateTimeAttribute, UnicodeAttribute, NumberAttribute

from blakerain.model.base import BaseModel, UUIDAttribute


class PageView(BaseModel, discriminator="PageView"):
    time = UTCDateTimeAttribute()
    user_agent = UnicodeAttribute()
    referrer = UnicodeAttribute(null=True)
    screen_width = NumberAttribute(null=True)
    screen_height = NumberAttribute(null=True)
    viewport_width = NumberAttribute(null=True)
    viewport_height = NumberAttribute(null=True)


def record_page_view(parameters) -> PageView:
    uuid = parameters.get("uuid", None)
    if not uuid:
        return None

    path = parameters.get("path", None)
    if not path:
        return None

    view = PageView(
        primary=path,
        section=)

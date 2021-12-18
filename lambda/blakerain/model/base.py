from uuid import UUID

import os

from pynamodb.attributes import Attribute, DiscriminatorAttribute, UnicodeAttribute
from pynamodb.constants import STRING
from pynamodb.indexes import AllProjection, GlobalSecondaryIndex
from pynamodb.models import Model


class UUIDAttribute(Attribute[UUID]):
    attr_type = STRING

    def serialize(self, value: UUID) -> str:
        return str(value)

    def deserialize(self, value: str) -> UUID:
        return UUID(value)


class BaseModel(Model):
    class Meta:
        table_name = os.getenv("DYNAMODB_TABLE_NAME", "analytics")
        region = os.getenv("DYNAMODB_REGION", "eu-west-1")
        host = os.getenv("DYNAMODB_HOST", None)
        read_capacity_units = int(os.getenv("DYNAMODB_RCU", "1"))
        write_capacity_units = int(os.getenv("DYNAMODB_WCU", "1"))

    primary = UnicodeAttribute(hash_key=True)
    section = UnicodeAttribute(range_key=True)
    cls = DiscriminatorAttribute()

    def __init_subclass__(cls, *args, **kwargs) -> None:
        cls.type = UnicodeAttribute(attr_name="type", default=cls.__name__)
        super().__init_subclass__(*args, **kwargs)

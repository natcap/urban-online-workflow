"""Pydantic models which define more or less a "schema" (a valid data shape)."""
from typing import Optional

from pydantic import BaseModel

from datetime import datetime

# Pydantic modles declare the types using ":", the new type annotation
# syntax/type hints

class ScenarioBase(BaseModel):
    name: str
    description: Optional[str] = None


class ScenarioCreate(ScenarioBase):
    pass


class Scenario(ScenarioBase):
    """Pydantic model (schema) used when reading data, when returning it from API."""
    id: int
    owner_id: int

    class Config:
        orm_mode = True


class UserBase(BaseModel):
    pass


class UserCreate(UserBase):
    pass


class User(UserBase):
    """Pydantic model (schema) used when reading data, when returning it from API."""
    id: int
    session_id: str
    last_active: datetime
    scenarios: list[Scenario] = []

    class Config:
        # Pydantic's 'orm_mode' will tell the Pydantic model to read the data
        # even if it is not a dict, but an ORM model (or any other arbitrary
        # object with attributes).
        # This way, instead of only trying to get the 'id' value from a dict
        # like: id = data["id"], it will also try to get it from an attr
        # like: id = data.id
        # With this, Pydantic model is compatible with ORMs, and you can
        # declare it in the 'response_model' argument in your path operations
        orm_mode = True


class JobBase(BaseModel):
    name: str
    description: str
    status: str


class JobCreate(JobBase):
    pass


class Job(JobBase):
    """Pydantic model (schema) used when reading data, when returning it from API."""
    id: int

    class Config:
        orm_mode = True

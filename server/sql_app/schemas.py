"""Pydantic models which define more or less a "schema" (a valid data shape)."""
from typing import Optional

from pydantic import BaseModel

from datetime import datetime

# Pydantic models declare the types using ":", the new type annotation
# syntax/type hints

class ScenarioBase(BaseModel):
    name: str
    description: Optional[str] = None


class Scenario(ScenarioBase):
    """Pydantic model (schema) used when reading data, when returning it from API."""
    scenario_id: int
    owner_id: str
    wkt: str
    lulc_result: str
    lulc_base: str

    class Config:
        orm_mode = True


class ScenarioOut(BaseModel):
    scenario_id: int

    class Config:
            orm_mode = True


class ScenarioAll(BaseModel):
    scenario_id: int
    name: str

    class Config:
            orm_mode = True


class User(BaseModel):
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


class UserOut(BaseModel):
    session_id: str

    class Config:
        orm_mode = True


class JobBase(BaseModel):
    name: str
    description: str
    status: str


class Job(JobBase):
    """Pydantic model (schema) used when reading data, when returning it from API."""
    job_id: int

    class Config:
        orm_mode = True


class JobStatus(BaseModel):
    status: str

    class Config:
        orm_mode = True


class JobOut(BaseModel):
    job_id: int

    class Config:
        orm_mode = True


class Pattern(BaseModel):
    """Pydantic model (schema) used when reading data, when returning it from API."""
    pattern_id: int
    name: str
    description: str
    wkt: str
    owner_id: str

    class Config:
        orm_mode = True


class PatternJob(BaseModel):
    pattern_id: int
    job_id: int

    class Config:
        orm_mode = True


class WorkerReponse(BaseModel):
    job_id: int
    status: str

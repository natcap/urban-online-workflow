"""Pydantic models which define more or less a "schema" (valid data shape)."""
from datetime import datetime
from typing import Optional, Union, Literal

from pydantic import BaseModel


class PatternBase(BaseModel):
    """Pydantic model base for Patterns."""
    label: str
    wkt: str


class Pattern(PatternBase):
    """Pydantic model used when reading data, when returning it from API."""
    pattern_id: int
    pattern_thumbnail_path: Union[str, None] = None

    class Config:
        orm_mode = True


class PatternResponse(BaseModel):
    """Pydantic model for the response after the pattern creation."""
    pattern_id: int
    label: str
    job_id: int

    class Config:
        orm_mode = True


class PatternUpdate(BaseModel):
    """Pydantic model for updating Pattern in the DB."""
    pattern_thumbnail_path: Union[str, None] = None


class ScenarioBase(BaseModel):
    """Pydantic model base for Scenarios."""
    name: str
    operation: Literal["wallpaper", "paint", "crop"]


class Scenario(ScenarioBase):
    """Pydantic model used when reading data, when returning it from API."""
    scenario_id: int
    study_area_id: int
    lulc_url_result: Union[str, None] = None
    lulc_url_base: str
    lulc_stats: Union[str, None] = None

    class Config:
        orm_mode = True


class ScenarioCreateResponse(BaseModel):
    """Pydantic model for the response after scenario creation."""
    scenario_id: int

    class Config:
        orm_mode = True


class ScenarioUpdate(BaseModel):
    """Pydantic model for updating Scenarios in the DB."""
    lulc_url_result: str
    lulc_stats: str


class ParcelStats(BaseModel):
    """Pydantic model base for ParcelStats."""
    lulc_stats: Union[str, None] = None

    class Config:
        orm_mode = True


class Parcel(BaseModel):
    """Pydantic model used by other Pydantic models."""
    parcel_id: int
    wkt: str
    address: str = None
    parcel_stats: Union[ParcelStats, None] = None

    class Config:
        orm_mode = True


class StudyArea(BaseModel):
    """Pydantic model used when reading data, when returning it from API."""
    id: int
    name: str = None
    parcels: list[Parcel] = []

    class Config:
        orm_mode = True


class StudyAreaCreateRequest(BaseModel):
    """Pydantic model for the body of the create study area request."""
    name: str


class Session(BaseModel):
    """Pydantic model used when reading data, when returning it from API."""
    id: int
    session_id: str
    last_active: datetime
    study_areas: list[StudyArea] = []
    patterns: list[Pattern] = []

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


class SessionResponse(BaseModel):
    """Pydantic model for the response after session creation."""
    session_id: str

    class Config:
        orm_mode = True


class JobBase(BaseModel):
    """Pydantic model base for Jobs."""
    name: str
    description: Optional[str] = None
    status: Literal['success', 'failed', 'pending', 'running']


class Job(JobBase):
    """Pydantic model used when reading data, when returning it from API."""
    job_id: int
    owner_id: str

    class Config:
        orm_mode = True


class JobStatus(BaseModel):
    """Pydantic model used for returning status response of a job."""
    status: Literal['success', 'failed', 'pending', 'running']

    class Config:
        orm_mode = True


class JobResponse(BaseModel):
    """Pydantic model for the response after job creation."""
    job_id: int

    class Config:
        orm_mode = True


class ParcelCreateRequest(BaseModel):
    """Pydantic model for payload of request to create parcel."""
    session_id: str
    study_area_id: int
    parcel_id: int
    address: str = None
    wkt: str


class ParcelDeleteRequest(BaseModel):
    """Pydantic model for payload of request to delete parcel."""
    parcel_id: int
    study_area_id: int


class ParcelStatsUpdate(BaseModel):
    """Pydantic model used for updating stats."""
    lulc_stats: str


class WorkerResponse(BaseModel):
    """Pydantic model used for the jobsqueue request from the worker."""
    result: Union[str, dict]
    status: Literal['success', 'failed', 'pending', 'running']
    server_attrs: dict

    class Config:
        orm_mode = True


class Wallpaper(BaseModel):
    """Pydantic model for the wallpaper request."""
    scenario_id: int
    pattern_id: int

    class Config:
        orm_mode = True


class ParcelFill(BaseModel):
    """Pydantic model for the parcel fill request."""
    scenario_id: int
    lulc_class: int

    class Config:
        orm_mode = True


class InvestResult(BaseModel):
    """Pydantic model used by other Pydantic models."""
    scenario_id: int
    job_id: int
    result: int = None

    class Config:
        orm_mode = True

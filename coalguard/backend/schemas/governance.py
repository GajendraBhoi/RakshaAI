from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class InspectionCreate(BaseModel):
    temp_uuid: str
    mine_id: str
    gps_lat: Optional[float] = None
    gps_lon: Optional[float] = None
    severity: str
    description: str
    photo_url: Optional[str] = None

class InspectionResponse(BaseModel):
    id: str
    temp_uuid: str
    model_config = ConfigDict(from_attributes=True)

class ActionCreate(BaseModel):
    observation_id: str
    owner_id: str
    due_date: datetime

class ActionUpdate(BaseModel):
    status: str
    evidence_url: Optional[str] = None

class ActionResponse(BaseModel):
    id: str
    status: str
    owner_id: str
    model_config = ConfigDict(from_attributes=True)

class AuditEventResponse(BaseModel):
    actor_id: str
    action: str
    timestamp: datetime = Field(alias="created_at")
    before_json: Optional[dict]
    after_json: Optional[dict]
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class ComplianceResponse(BaseModel):
    id: str
    title: str
    due_date: datetime
    status: str
    model_config = ConfigDict(from_attributes=True)

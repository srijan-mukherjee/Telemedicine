"""Doctor availability request/response schemas."""

from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AvailabilityCreate(BaseModel):
    day_of_week: int | None = Field(default=None, ge=0, le=6)
    start_time: time | None = None
    end_time: time | None = None
    specific_date: date | None = None
    is_recurring: bool = True
    is_holiday: bool = False

    @model_validator(mode="after")
    def validate_shape(self):
        if self.is_holiday:
            if self.specific_date is None:
                raise ValueError("Holiday availability requires specific_date")
            if self.is_recurring:
                raise ValueError("Holiday availability must be date-specific")
            return self

        if self.start_time is None or self.end_time is None:
            raise ValueError("Availability windows require start_time and end_time")
        if self.start_time >= self.end_time:
            raise ValueError("start_time must be before end_time")

        if self.is_recurring:
            if self.day_of_week is None:
                raise ValueError("Recurring availability requires day_of_week")
            if self.specific_date is not None:
                raise ValueError("Recurring availability cannot also use specific_date")
        else:
            if self.specific_date is None:
                raise ValueError("Date-specific availability requires specific_date")

        return self


class AvailabilityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_id: int
    day_of_week: int | None
    start_time: time | None
    end_time: time | None
    specific_date: date | None
    is_recurring: bool
    is_holiday: bool


class SlotOut(BaseModel):
    doctor_id: int
    date: date
    start_time: time
    end_time: time
    slot_datetime: str

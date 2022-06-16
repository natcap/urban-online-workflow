""" Create SQLAlchemy models from the 'Base' class."""
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .database import Base

# SQLAlchemy uses 'model' to refer to these classes and instances that
# interact with the database
# Pydantic uses term 'model' to refer to data validation, conversion, and
# documentation classes and instances


class Job(Base):
    """SQLAlchemy model."""
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(String, index=True)


class User(Base):
    """SQLAlchemy model."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

    """
    'relationship' a "magic" attribute that will contain the values from
    other tables related to this one.
    When accessing the attribute 'items' in a User, as in 'my_user.items',
    it will have a list of Item SQLAlchemy models (from the 'items' table)
    that have a foreign key pointing to this record in the 'users' table.

    When you access 'my_user.items', SQLA will actually go and fetch the items
    from the db in the 'items' table and populate them here.
    """
    items = relationship("Item", back_populates="owner")


class Item(Base):
    """SQLAlchemy model."""
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="items")

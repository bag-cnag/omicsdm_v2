from typing import TYPE_CHECKING

from sqlalchemy import Column, ForeignKeyConstraint, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, relationship, mapped_column

from biodm.components.table import Base

if TYPE_CHECKING:
    from biodm.tables import User
    from .file import File


class Visualization(Base):
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=True)

    # Foreign Keys
    user_username:   Mapped[str] = mapped_column(ForeignKey("USER.username"))

    file_id      = Column(Integer, nullable=False)
    file_version = Column(Integer, nullable=False)

    # Relationships
    user:    Mapped["User"] = relationship(foreign_keys=[user_username])
    file:    Mapped["File"] = relationship(foreign_keys=[file_id, file_version])

    __table_args__ = (
        ForeignKeyConstraint(
            ["file_id", "file_version"],
            ["FILE.id", "FILE.version"],
            name="fk_visualization_file",
        ),
    )

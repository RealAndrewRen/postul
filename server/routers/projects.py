from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import logging

from database import get_db, Project
from schema import ProjectResponse
from dependencies import OptionalCurrentUser, get_user_id_or_anonymous

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    optional_user_id: OptionalCurrentUser,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """
    List projects for the current user.
    Works for both authenticated and anonymous users.
    Anonymous users can only see projects they created.
    
    Args:
        optional_user_id: Optional authenticated user ID (None for anonymous users)
        limit: Maximum number of results
        offset: Offset for pagination
        db: Database session
        
    Returns:
        List of ProjectResponse objects
    """
    user_id = get_user_id_or_anonymous(optional_user_id)
    
    query = select(Project).where(Project.user_id == user_id)
    query = query.order_by(Project.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    projects = result.scalars().all()
    
    responses = []
    for project in projects:
        responses.append(
            ProjectResponse(
                id=project.id,
                user_id=project.user_id,
                name=project.name,
                description=project.description,
                created_at=project.created_at,
                updated_at=project.updated_at,
            )
        )
    
    return responses


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    optional_user_id: OptionalCurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific project by ID.
    Works for both authenticated and anonymous users.
    Anonymous users can only access projects they created.
    
    Args:
        project_id: Project ID
        optional_user_id: Optional authenticated user ID (None for anonymous users)
        db: Database session
        
    Returns:
        ProjectResponse with project details
    """
    user_id = get_user_id_or_anonymous(optional_user_id)
    
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == user_id
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found"
        )
    
    return ProjectResponse(
        id=project.id,
        user_id=project.user_id,
        name=project.name,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


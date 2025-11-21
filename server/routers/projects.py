from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from database import get_db, Project
from schema import ProjectResponse, ProjectCreateRequest
from dependencies import OptionalCurrentUser, get_user_id_or_anonymous
from services.ai_service import ai_service
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


class GenerateProjectDetailsRequest(BaseModel):
    """Request model for generating project details from transcribed text."""
    transcribed_text: str = Field(..., min_length=10, description="Transcribed text from voice input")


class ProjectDetailsResponse(BaseModel):
    """Response model for generated project details."""
    name: str
    description: str


@router.post("/generate-details", response_model=ProjectDetailsResponse)
async def generate_project_details(
    optional_user_id: OptionalCurrentUser,
    request: GenerateProjectDetailsRequest,
):
    """
    Generate project name and description from transcribed text using AI.
    
    Args:
        request: Request with transcribed text
        
    Returns:
        ProjectDetailsResponse with generated name and description
    """
    try:
        details = await ai_service.generate_project_details(request.transcribed_text)
        return ProjectDetailsResponse(name=details.name, description=details.description)
    except Exception as e:
        logger.error(f"Error generating project details: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate project details. Please try again."
        )


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


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    request: ProjectCreateRequest,
    optional_user_id: OptionalCurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new project.
    Works for both authenticated and anonymous users.
    
    Args:
        request: Project creation request with name and description
        optional_user_id: Optional authenticated user ID (None for anonymous users)
        db: Database session
        
    Returns:
        ProjectResponse with created project details
    """
    try:
        # Get user ID (authenticated or anonymous)
        user_id = get_user_id_or_anonymous(optional_user_id)
        
        # Create project
        project = Project(
            user_id=user_id,
            name=request.name,
            description=request.description,
        )
        
        db.add(project)
        await db.flush()  # Flush to get the ID
        await db.refresh(project)
        
        user_type = "authenticated" if optional_user_id else "anonymous"
        logger.info(f"Successfully created project with id {project.id} for {user_type} user")
        
        return ProjectResponse(
            id=project.id,
            user_id=project.user_id,
            name=project.name,
            description=project.description,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )
        
    except Exception as e:
        logger.error(f"Error creating project: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project. Please try again."
        )


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


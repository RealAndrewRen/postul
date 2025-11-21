from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import logging

from database import get_db, Idea, Project
from schema import IdeaAnalysisRequest, IdeaResponse, ExtendedIdeaAnalysis
from services.ai_service import ai_service
from dependencies import OptionalCurrentUser, get_user_id_or_anonymous

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ideas", tags=["ideas"])


@router.post("/analyze", response_model=IdeaResponse, status_code=status.HTTP_201_CREATED)
async def analyze_idea(
    request: IdeaAnalysisRequest,
    optional_user_id: OptionalCurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Analyze a transcribed idea and generate AI-powered insights.
    Works for both authenticated and anonymous users.
    
    Args:
        request: Idea analysis request with transcribed text
        optional_user_id: Optional authenticated user ID (None for anonymous users)
        db: Database session
        
    Returns:
        IdeaResponse with analysis and actionable items
    """
    try:
        # Get user ID (authenticated or anonymous)
        user_id = get_user_id_or_anonymous(optional_user_id)
        
        # Validate project_id if provided
        if request.project_id:
            result = await db.execute(
                select(Project).where(
                    Project.id == request.project_id,
                    Project.user_id == user_id
                )
            )
            project = result.scalar_one_or_none()
            if not project:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Project with id {request.project_id} not found"
                )
        
        # Generate AI analysis
        user_type = "authenticated" if optional_user_id else "anonymous"
        logger.info(f"Generating analysis for {user_type} user {user_id}")
        analysis = await ai_service.analyze_idea(request.transcribed_text)
        
        # Convert ExtendedIdeaAnalysis to dict for JSON storage
        analysis_dict = analysis.model_dump()
        
        # Create idea record in database
        idea = Idea(
            user_id=user_id,
            project_id=request.project_id,  # Allow project_id for both authenticated and anonymous users
            transcribed_text=request.transcribed_text,
            analysis_json=analysis_dict,
        )
        
        db.add(idea)
        await db.flush()  # Flush to get the ID
        await db.refresh(idea)
        
        # Build response
        response = IdeaResponse(
            id=idea.id,
            user_id=idea.user_id,
            project_id=idea.project_id,
            transcribed_text=idea.transcribed_text,
            analysis=analysis,
            created_at=idea.created_at,
            updated_at=idea.updated_at,
        )
        
        logger.info(f"Successfully created idea analysis with id {idea.id} for {user_type} user")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing idea: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze idea. Please try again."
        )


@router.get("/{idea_id}", response_model=IdeaResponse)
async def get_idea(
    idea_id: int,
    optional_user_id: OptionalCurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific idea by ID.
    Works for both authenticated and anonymous users.
    Anonymous users can only access ideas they created.
    
    Args:
        idea_id: Idea ID
        optional_user_id: Optional authenticated user ID (None for anonymous users)
        db: Database session
        
    Returns:
        IdeaResponse with analysis
    """
    user_id = get_user_id_or_anonymous(optional_user_id)
    
    result = await db.execute(
        select(Idea).where(
            Idea.id == idea_id,
            Idea.user_id == user_id
        )
    )
    idea = result.scalar_one_or_none()
    
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Idea with id {idea_id} not found"
        )
    
    # Convert analysis_json to ExtendedIdeaAnalysis model
    analysis = ExtendedIdeaAnalysis(**idea.analysis_json)
    
    return IdeaResponse(
        id=idea.id,
        user_id=idea.user_id,
        project_id=idea.project_id,
        transcribed_text=idea.transcribed_text,
        analysis=analysis,
        created_at=idea.created_at,
        updated_at=idea.updated_at,
    )


@router.get("", response_model=list[IdeaResponse])
async def list_ideas(
    optional_user_id: OptionalCurrentUser,
    project_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """
    List ideas for the current user.
    Works for both authenticated and anonymous users.
    Anonymous users can only see ideas they created.
    
    Args:
        optional_user_id: Optional authenticated user ID (None for anonymous users)
        project_id: Optional project ID filter (only for authenticated users)
        limit: Maximum number of results
        offset: Offset for pagination
        db: Database session
        
    Returns:
        List of IdeaResponse objects
    """
    user_id = get_user_id_or_anonymous(optional_user_id)
    
    query = select(Idea).where(Idea.user_id == user_id)
    
    # Project filtering for both authenticated and anonymous users
    if project_id:
        query = query.where(Idea.project_id == project_id)
    
    query = query.order_by(Idea.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    ideas = result.scalars().all()
    
    responses = []
    for idea in ideas:
        analysis = ExtendedIdeaAnalysis(**idea.analysis_json)
        responses.append(
            IdeaResponse(
                id=idea.id,
                user_id=idea.user_id,
                project_id=idea.project_id,
                transcribed_text=idea.transcribed_text,
                analysis=analysis,
                created_at=idea.created_at,
                updated_at=idea.updated_at,
            )
        )
    
    return responses


@router.patch("/{idea_id}", response_model=IdeaResponse)
async def update_idea(
    idea_id: int,
    project_id: Optional[int] = None,
    optional_user_id: OptionalCurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Update an idea, primarily to associate it with a project.
    Works for both authenticated and anonymous users.
    
    Args:
        idea_id: Idea ID to update
        project_id: Optional project ID to associate the idea with
        optional_user_id: Optional authenticated user ID (None for anonymous users)
        db: Database session
        
    Returns:
        Updated IdeaResponse
    """
    user_id = get_user_id_or_anonymous(optional_user_id)
    
    # Get the idea
    result = await db.execute(
        select(Idea).where(
            Idea.id == idea_id,
            Idea.user_id == user_id
        )
    )
    idea = result.scalar_one_or_none()
    
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Idea with id {idea_id} not found"
        )
    
    # Validate project_id if provided
    if project_id is not None:
        project_result = await db.execute(
            select(Project).where(
                Project.id == project_id,
                Project.user_id == user_id
            )
        )
        project = project_result.scalar_one_or_none()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project with id {project_id} not found"
            )
        idea.project_id = project_id
    
    await db.flush()
    await db.refresh(idea)
    
    # Convert analysis_json to ExtendedIdeaAnalysis model
    analysis = ExtendedIdeaAnalysis(**idea.analysis_json)
    
    return IdeaResponse(
        id=idea.id,
        user_id=idea.user_id,
        project_id=idea.project_id,
        transcribed_text=idea.transcribed_text,
        analysis=analysis,
        created_at=idea.created_at,
        updated_at=idea.updated_at,
    )


from google.adk.tools import ToolContext
from typing import Dict, Literal

def set_review_status_and_exit_if_approved(
    status: Literal["APPROVED", "NEEDS_REVISION"],
    review_feedback: str,
    tool_context: ToolContext
) -> Dict[str, str]:
    """
    Sets the review status. If "APPROVED", this tool sets the
    escalation flag to terminate the parent LoopAgent.
    """
    if not status:
        return {"status": "error", "message": "Status cannot be empty."}

    tool_context.state['review_status'] = status
    tool_context.state['review_feedback'] = review_feedback
    
    if status == "APPROVED":
        tool_context.actions.escalate = True
        return {
            "status": "success",
            "message": "Status set to APPROVED. Exiting refinement loop."
        }
    else:
        return {
            "status": "success",
            "message": "Status set to NEEDS_REVISION. Feedback saved."
        }


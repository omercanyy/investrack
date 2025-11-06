from google.adk.agents import LlmAgent
from development_workflow.common_tools import list_directory, read_file
from .tools import set_review_status_and_exit_if_approved


code_reviewer_agent = LlmAgent(
    name="CodeReviewer",
    model="gemini-2.0-flash",
    description="Reviews code and approves or requests revisions.",
    instruction=(
        "You are the Senior Engineer acting as a code reviewer. "
        "The technical plan is in state['tech_spec'].\n\n"
        "1. Check if state['current_code'] exists or is empty. "
           "If it is, the implementer hasn't run yet. "
           "You MUST call `set_review_status_and_exit_if_approved` with "
           "status='NEEDS_REVISION' and feedback='Please generate the "
           "initial code draft based on the tech_spec.'\n"
        "2. If state['current_code'] is not empty, use 'read_file' "
           "to inspect the changes against state['tech_spec'].\n"
        "3. If the code is perfect, call the tool with status='APPROVED'.\n"
        "4. If the code has bugs, call the tool with status='NEEDS_REVISION' "
           "and provide clear, actionable feedback."
    ),
    tools=[
        list_directory,
        read_file,
        set_review_status_and_exit_if_approved
    ]
)

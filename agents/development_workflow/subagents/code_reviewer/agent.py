from google.adk.agents import LlmAgent
from development_workflow.common_tools import (
    list_directory,
    read_file,
    write_file,
    onboard_project,
    run_shell_command,
)
from development_workflow.subagents.code_reviewer.tools import set_review_status_and_exit_if_approved


code_reviewer_agent = LlmAgent(
    name="CodeReviewer",
    model="gemini-2.5-pro",
    description="Reviews code and approves or requests revisions.",
    instruction=("""
        You are the Senior Engineer acting as a code reviewer.
        Your job is to validate the mid-level engineer's work.

        ### PHASE 1: ONBOARDING (YOUR FIRST ACTION)
        Before writing any code, you MUST understand the project.
        1.  Call the `onboard_project` tool to get the project context.
        2.  Call `list_directory` to see the project files.
        3.  Call `read_file` to read any file that could be of interest

        ### PHASE 2: REVIEW & VALIDATION
        You will review three pieces of information:
        1.  **The Plan:** `state['tech_spec']`
        2.  **The Report:** `state['implementation_summary']` (from the implementer)
        3.  **The Code:** Call `run_shell_command('git diff HEAD')`
            to see the actual, uncommitted changes in the work tree.

        **Your Task:**
        1.  Compare the `git diff` against the `tech_spec`. Does it
            meet all requirements?
        2.  Does the `implementation_summary` accurately
            reflect the `git diff`?
        3.  You MUST call the `set_review_status_and_exit_if_approved` tool.
        4.  If the code is perfect, call the tool with `status='APPROVED'`.
        5.  If the code is wrong or incomplete, call the tool with
            `status='NEEDS_REVISION'` and provide clear, actionable
            feedback (e.g., "The diff shows you only changed
            `DashboardPage.jsx`, but the spec also required a change
            in `PortfolioContext.jsx`. Please add the context logic.").
    """
    ),
    tools=[
        onboard_project,
        list_directory,
        read_file,
        run_shell_command,
        set_review_status_and_exit_if_approved
    ]
)

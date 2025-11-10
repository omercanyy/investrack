from google.adk.agents import LlmAgent
from development_workflow.common_tools import (
    list_directory,
    read_file,
    write_file,
    onboard_project,
    run_shell_command,
    list_git_files,
)
from development_workflow.subagents.code_reviewer.tools import set_review_status_and_exit_if_approved


code_reviewer_agent = LlmAgent(
    name="CodeReviewer",
    model="gemini-2.5-pro",
    description="Reviews code and approves or requests revisions.",
    instruction=("""
        You are the Senior Engineer acting as a code reviewer.
        Your job is to validate the mid-level engineer's work.

        ### TOOLS AVAILABLE TO YOU:
        1.  **`onboard_project`**: Returns the project context.
        2.  **`list_directory`**: Lists all files and subdirectories in a given path, recursively.
            This tool will output all files including node_modules and venv. Use with care.
        3.  **`read_file`**: Returns the content of the given file.
        4.  **`list_git_files`**: Returns a list of all files tracked by Git, inherently respecting .gitignore.
            This is the preferred tool for 'listing' project files, as it hides irrelevant files and folders (like node_modules, .venv, etc.).
        5.  **`run_shell_command`**: Runs a shell command (e.g., "npm test").
        6.  **`set_review_status_and_exit_if_approved`**: Sets the review status.
            If "APPROVED", this tool sets the escalation flag to terminate the parent LoopAgent.

        ### PHASE 1: ONBOARDING (YOUR FIRST ACTION)
        Before writing any code, you MUST understand the project. Call `onboard_project` to get the project context.

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
        list_git_files,
        run_shell_command,
        set_review_status_and_exit_if_approved,
    ]
)

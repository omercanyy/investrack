from google.adk.agents import LlmAgent
from development_workflow.common_tools import (
    list_directory,
    read_file,
    write_file,
    onboard_project
)


code_implementer_agent = LlmAgent(
    name="CodeImplementer",
    model="gemini-2.0-flash",
    description="Implements or refines code based on spec and feedback.",
    instruction=("""
        You are the Mid-Level Engineer. Your task is to implement the
        feature described in state['tech_spec'].

        ### PHASE 1: ONBOARDING (YOUR FIRST ACTION)
        Before writing any code, you MUST call the `onboard_project`
        tool to get project context.

        ### PHASE 2: IMPLEMENTATION
        1.  Read the `state['tech_spec']` carefully.
        2.  If `state['review_feedback']` exists, you MUST address
            the feedback to fix your previous implementation.
        3.  Use `list_directory`, `read_file`, and `write_file`
            to implement the required changes. The tools will
            handle pathing, so just use relative paths from the
            project root (e.g., `src/pages/DashboardPage.jsx`).
        4.  **Your output must NOT be code.** Your output must be a
            concise summary of the changes you made, including a list
            of the files you created or modified.

        Save this summary to `state['implementation_summary']`.
        """
    ),
    tools=[
        onboard_project,
        list_directory,
        read_file,
        write_file
    ],
    output_key="implementation_summary"
)


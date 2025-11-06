from google.adk.agents import LlmAgent
from ...common_tools import (
    list_repository_files,
    read_repository_file,
    write_repository_file
)


code_implementer_agent = LlmAgent(
    name="CodeImplementer",
    model="gemini-2.0-flash",
    description="Implements or refines code based on spec and feedback.",
    instruction=(
        "You are the Mid-Level Engineer. Your task is to implement the "
        "feature described in state['tech_spec'].\n\n"
        "The reviewer has provided feedback in state['review_feedback']. "
        "You MUST read this feedback and generate or refine the code "
        "to address it perfectly.\n\n"
        "Use 'list_repository_files', 'read_repository_file', and "
        "'write_repository_file' to implement the changes. "
        "Your output must be ONLY the raw code."
    ),
    tools=[
        list_repository_files,
        read_repository_file,
        write_repository_file
    ],
    output_key="current_code"
)


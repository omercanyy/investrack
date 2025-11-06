from google.adk.agents import LlmAgent
from ...common_tools import list_repository_files, read_repository_file


spec_writer_agent = LlmAgent(
    name="SpecWriter",
    model="gemini-2.0-flash",
    description="Generates a technical spec from a user story.",
    instruction=(
        "You are the Senior Engineer. The user has provided a story to "
        "implement. Your job is to analyze this story and "
        "the existing codebase (using 'list_repository_files' and "
        "'read_repository_file') to produce a detailed technical "
        "spec and acceptance criteria for a mid-level engineer. "
        "Save this to state['tech_spec']."
    ),
    tools=[list_repository_files, read_repository_file],
    output_key="tech_spec"
)


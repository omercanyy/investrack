from google.adk.agents import LlmAgent
from development_workflow.common_tools import list_directory, read_file


spec_writer_agent = LlmAgent(
    name="SpecWriter",
    model="gemini-2.0-flash",
    description="Generates a technical spec from a user story.",
    instruction=(
        "You are the Senior Engineer. The user has provided a story to "
        "implement. Your job is to analyze this story and "
        "the existing codebase (using 'list_directory' and "
        "'read_file') to produce a detailed technical "
        "spec and acceptance criteria for a mid-level engineer. "
        "Save this to state['tech_spec']."
    ),
    tools=[list_directory, read_file],
    output_key="tech_spec"
)


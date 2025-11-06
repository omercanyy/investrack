from google.adk.agents import SequentialAgent, LoopAgent

from .subagents.spec_writer.agent import spec_writer_agent
from .subagents.code_reviewer.agent import code_reviewer_agent
from .subagents.code_implementer.agent import code_implementer_agent
from .subagents.git_committer.agent import git_committer_agent


# --- Define the Loop Agent (Iterative Refinement) ---
code_refinement_loop = LoopAgent(
    name="CodeRefinementLoop",
    max_iterations=5,
    sub_agents=[
        code_reviewer_agent,
        code_implementer_agent
    ],
    description="Iteratively reviews and refines code."
)

# --- Define the Root Sequential Agent ---
DevelopmentWorkflowAgent = SequentialAgent(
    name="DevelopmentWorkflowAgent",
    sub_agents=[
        spec_writer_agent,
        code_refinement_loop,
        git_committer_agent
    ],
    description="Manages the end-to-end software feature development process."
)

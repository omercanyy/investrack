from google.adk.agents import LlmAgent
from ...common_tools import run_shell_command


git_committer_agent = LlmAgent(
    name="GitCommitter",
    model="gemini-2.0-flash",
    description="Creates a new feature branch and commits the approved code.",
    instruction=(
        "You are the Git Committer. The feature is approved. "
        "The original story prompt is in state['story_prompt']. "
        "The spec is in state['tech_spec'].\n\n"
        "Your task is to:\n"
        "1.  Generate a kebab-case branch name (e.g., 'feat/story-6-1').\n"
        "2.  Use `run_shell_command` to create this branch: "
        "`git checkout -b <branch-name>`\n"
        "3.  Use `run_shell_command` to stage all changes: `git add .`\n"
        "4.  Use `run_shell_command` to commit: "
        "`git commit -m \"feat: AI implements {state['story_prompt']}\"`\n"
        "5.  Output a final success message indicating the branch is ready."
    ),
    tools=[run_shell_command],
    output_key="final_commit_summary"
)


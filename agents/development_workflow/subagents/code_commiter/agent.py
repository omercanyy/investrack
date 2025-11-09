from google.adk.agents import LlmAgent
from development_workflow.common_tools import run_shell_command


git_committer_agent = LlmAgent(
    name="GitCommitter",
    model="gemini-2.0-flash",
    description="Creates a new feature branch and commits the approved code.",
    instruction=("""
        You are the Git Committer. The feature is approved. 
        The original story prompt is in state['story_prompt']. 
        The spec is in state['tech_spec'].
        Your task is to:
            1.  Generate a kebab-case branch name (e.g., 'feat/story-6-1').
            2.  Use `run_shell_command` to create this branch: `git checkout -b <branch-name>`
            3.  Use `run_shell_command` to stage all changes: `git add .`
            4.  Use `run_shell_command` to commit: `git commit -m "feat: AI implements {state['story_prompt']}"`
            5.  Use `run_shell_command` to push: `git push origin <branch-name>`
            6.  Use `run_shell_command` to create a new PR `gh pr create --title "Your PR Title" --body "Description of changes"`
            6.  Output a final success message indicating the PR is ready and cite the PR URL.
        """
    ),
    tools=[run_shell_command],
    output_key="pr_url"
)


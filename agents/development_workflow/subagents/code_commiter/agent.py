from google.adk.agents import LlmAgent
from development_workflow.common_tools import run_shell_command


git_committer_agent = LlmAgent(
    name="GitCommitter",
    model="gemini-2.0-flash",
    description="Creates a new feature branch and commits the approved code.",
    instruction=("""
        You are the Git Committer. The feature is approved. 

        * The original story prompt is in state['story_prompt']. 
        * The spec is in state['tech_spec'].
        * The implementation summary is in state['implementation_summary'].

        Your task is to:
            1. Generate a kebab-case branch name (e.g., `feat/feature-name` or `bug/bug-description`). 
               Please derive a related branch name from the spec title or content.
               etc. formats.
            2. Use `run_shell_command` to create this branch: `git checkout -b <branch-name>`
            3. Use `run_shell_command` to stage all changes: `git add .`
            4. Use `run_shell_command` to commit: `git commit -m "<commit-message>"`
               Form your commit message in `feat: AI implements: <feature>` or `bug: AI fixes: <bug>` formats.
            5. Use `run_shell_command` to push: `git push origin <branch-name>`
            6. Use `run_shell_command` to create a PR. The title should be the
               commit message, and the body should be the .
               `gh pr create --title "<commit-message>" --body "<implementation_summary>"`
            6. Output a final success message with the link to the PR created.
        """
    ),
    tools=[run_shell_command],
    output_key="final_commit_summary"
)


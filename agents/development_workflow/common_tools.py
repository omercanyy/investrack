# agents/tools.py
import pathlib
import subprocess


# --- Path Safety Configuration ---
REPO_ROOT = pathlib.Path(__file__).parent.parent.parent.parent.resolve()

def safe_path(file_path: str) -> pathlib.Path:
    """Resolves a user-provided path against the REPO_ROOT."""
    resolved_path = (REPO_ROOT / file_path).resolve()
    # Check if REPO_ROOT is a parent of the resolved path
    if REPO_ROOT != resolved_path and REPO_ROOT not in resolved_path.parents:
        raise ValueError("Error: Path is outside the repository boundary.")
    return resolved_path


def read_file(path: str) -> str:
    """Reads the full content of a specified file from the repository."""
    try:
        return safe_path(path).read_text()
    except Exception as e:
        return f"Error reading file {path}: {e}"


def write_file(path: str, content: str) -> str:
    """Writes or overwrites content to a specified file in the repository."""
    try:
        safe_path(path).write_text(content)
        return f"File {path} written successfully."
    except Exception as e:
        return f"Error writing file {path}: {e}"


def list_directory(path: str) -> list[str]:
    """Lists all files and subdirectories in a given path, recursively."""
    try:
        root = safe_path(path)
        files = [str(p.relative_to(REPO_ROOT)) for p in root.glob('**/*')]
        return files
    except Exception as e:
        return [f"Error listing directory {path}: {e}"]


def run_shell_command(command: str) -> str:
    """Runs a shell command (e.g., "npm test") from the repository root."""
    try:
        result = subprocess.run(
            command,
            cwd=REPO_ROOT,
            shell=True,
            text=True,
            capture_output=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        return f"Command failed with error:\nSTDOUT:\n{e.stdout}\nSTDERR:\n{e.stderr}"

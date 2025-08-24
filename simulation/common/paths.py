from __future__ import annotations
from pathlib import Path
from typing import Optional


def get_project_root(start: Optional[Path] = None) -> Path:
    """Return project root (directory containing the repo). Heuristic: ascend until a
    directory that contains either `.git`, `requirements.txt`, or `config/`.
    Falls back to 3-level parent of this file.
    """
    here = Path(__file__).resolve()
    cur = start.resolve() if isinstance(start, Path) else here
    # Attempt to ascend up to 6 levels
    for p in [cur] + list(cur.parents)[:6]:
        if (p / ".git").exists() or (p / "requirements.txt").exists() or (p / "config").exists():
            return p
    # Fallback to package root: simulation/common/ -> project root is parents[2]
    return here.parents[2]


def get_config_path(name: str) -> Path:
    """Return path to a file under centralized `config/` at project root.
    Does not create the file; only resolves the path.
    """
    root = get_project_root()
    return root / "config" / name

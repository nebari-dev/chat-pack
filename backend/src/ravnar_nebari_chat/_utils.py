__all__ = ["format_multiline"]

import textwrap


def format_multiline(s: str) -> str:
    return textwrap.dedent(s.strip())

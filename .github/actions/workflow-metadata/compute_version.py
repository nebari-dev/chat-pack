import argparse
import dataclasses
import json

from uv_dynamic_versioning.main import get_version
from uv_dynamic_versioning.version_source import DynamicVersionSource


@dataclasses.dataclass
class Input:
    root: str
    pattern_prefix: str


@dataclasses.dataclass
class Output:
    version: str
    base: str
    commit: str


def main(input: Input) -> None:
    source = DynamicVersionSource(root=input.root, config={})
    config = dataclasses.replace(source.project_config, pattern_prefix=input.pattern_prefix)
    version, parts = get_version(config)
    output = Output(
        version=version,
        base=parts.base,
        commit=parts.commit,
    )
    print(json.dumps(dataclasses.asdict(output)))


def parse_argv(argv: list[str] = None) -> Input:
    parser = argparse.ArgumentParser()

    parser.add_argument("--root", default=".")
    parser.add_argument("--pattern-prefix", default="")

    args = parser.parse_args(argv)
    return Input(**args.__dict__)


if __name__ == "__main__":
    input = parse_argv()
    main(input)

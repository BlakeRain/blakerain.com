#!/usr/bin/env python3
import re
import sys

def bump(version: str, stage: str):
    if stage == 'major':
        return f'{int(version.split(".")[0]) + 1}.0.0'
    elif stage == 'minor':
        return f'{version.split(".")[0]}.{int(version.split(".")[1]) + 1}.0'
    elif stage == 'patch':
        return f'{version.split(".")[0]}.{version.split(".")[1]}.{int(version.split(".")[2]) + 1}'
    else:
        raise Exception(f'Unknown stage: {stage}')

def bump_replace(match, stage: str) -> str:
    return bump(match.group(), stage)

def bump_version_in_string(input: str, stage: str):
    return re.sub(r'\d+\.\d+\.\d+', lambda match: bump_replace(match, stage), input)

stage = None
if len(sys.argv) == 2:
    stage = sys.argv[1]
    if stage not in ['major', 'minor', 'patch']:
        raise Exception(f'Unknown stage: {stage}')

if not stage:
    raise Exception('No stage provided')

# For 'Cargo.toml', we bump the first line that contains 'version ='
with open("Cargo.toml") as fp:
    lines = fp.readlines()
with open("Cargo.toml", "w") as fp:
    for line in lines:
        if line.startswith('version ='):
            fp.write(bump_version_in_string(line, stage))
        else:
            fp.write(line)

# For 'package.json', we bump the first line that starts with '"version":'
with open("package.json") as fp:
    lines = fp.readlines()
with open("package.json", "w") as fp:
    for line in lines:
        if line.startswith('  "version":'):
            fp.write(bump_version_in_string(line, stage))
        else:
            fp.write(line)

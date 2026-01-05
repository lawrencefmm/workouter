import json
import hashlib
from pathlib import Path
from parse_program import build_program

md = Path('powerbuilding_workouts_by_week.md').read_text(encoding='utf-8')
program = build_program(md)
program_json = json.dumps(program, separators=(',', ':'), ensure_ascii=False)
program_hash = hashlib.sha256(program_json.encode('utf-8')).hexdigest()[:12]

content = """import { ProgramData } from './types';

export const programData: ProgramData = %s as const;
export const programVersion = '%s';
""" % (json.dumps(program, indent=2, ensure_ascii=False), program_hash)

Path('src/data/program.ts').write_text(content, encoding='utf-8')

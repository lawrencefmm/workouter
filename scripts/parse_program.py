import json
import re
from pathlib import Path

week_re = re.compile(r'^#\s+Week\s+([A-Za-z0-9]+)\b')
day_re = re.compile(r'^##\s+(.+?)\s*$')

def week_order(key:str):
    m = re.match(r'^(\d+)([A-Za-z]+)?$', key)
    if not m:
        return 0
    num = int(m.group(1))
    suffix = m.group(2) or ''
    suffix = suffix.upper()
    suffix_order = 0
    if suffix:
        # map A->1, B->2, etc
        suffix_order = sum((ord(ch) - 64) for ch in suffix)
    return num * 100 + suffix_order


def normalize_name(name:str):
    base = name.strip()
    base = re.sub(r'^[A-Z]\d+[\.:]\s*', '', base)
    base = base.lower()
    # remove punctuation-ish noise
    base = re.sub(r'[^a-z0-9\s]', ' ', base)
    base = re.sub(r'\s+', ' ', base).strip()
    return base


def superset_group(name:str):
    m = re.match(r'^\s*([A-Z])\d+[\.:]', name.strip())
    return m.group(1).upper() if m else None


def parse_percent(text:str):
    if not text:
        return (None, None)
    t = text.replace('–','-')
    t = t.replace('%','')
    nums = re.findall(r'\d+(?:\.\d+)?', t)
    if not nums:
        return (None, None)
    if len(nums) == 1:
        val = float(nums[0])
        return (val, val)
    val_min = float(nums[0])
    val_max = float(nums[1])
    return (val_min, val_max)


def primary_lift(normalized:str):
    n = normalized
    if not n:
        return None
    if 'deadlift' in n:
        return 'DEADLIFT'
    if 'bench press' in n or n == 'bench' or n.endswith(' bench') or n.startswith('bench '):
        return 'BENCH'
    if 'overhead press' in n or n == 'ohp' or 'push press' in n:
        return 'OHP'
    if 'squat' in n:
        return 'SQUAT'
    return None

def build_program(md_text: str):
    lines = md_text.splitlines()
    weeks = []
    current_week = None
    current_day = None
    in_table = False
    header = []

    for line in lines:
        week_match = week_re.match(line)
        if week_match:
            if current_day and current_day['exercises']:
                current_week['days'].append(current_day)
            current_day = None
            if current_week:
                current_week['days'] = [d for d in current_week['days'] if d['exercises']]
                weeks.append(current_week)
            key = week_match.group(1)
            current_week = {
                'key': key,
                'title': f'Week {key}',
                'order': week_order(key),
                'days': []
            }
            in_table = False
            header = []
            continue

        day_match = day_re.match(line)
        if day_match and current_week:
            if current_day and current_day['exercises']:
                current_week['days'].append(current_day)
            current_day = {
                'title': day_match.group(1).strip(),
                'order': len(current_week['days']) + 1,
                'exercises': []
            }
            in_table = False
            header = []
            continue

        if line.strip().startswith('| Exercise |'):
            in_table = True
            header = [h.strip() for h in line.strip().strip('|').split('|')]
            continue

        if in_table:
            if not line.strip() or not line.strip().startswith('|'):
                in_table = False
                header = []
                continue
            if re.match(r'^\|\s*-', line.strip()):
                continue
            row = [c.strip() for c in line.strip().strip('|').split('|')]
            if len(row) != len(header):
                continue
            data = dict(zip(header, row))
            name = data.get('Exercise','').strip()
            if not name or not current_day:
                continue
            reps = data.get('Reps','').strip()
            warmup = data.get('Warmup Sets','').strip()
            working = data.get('Working Sets','').strip()
            load = data.get('Load (lbs)','').strip()
            percent = data.get('%1RM','').strip()
            rpe = data.get('RPE','').strip()
            rest = data.get('Rest','').strip()
            notes = data.get('Notes','').strip()

            norm = normalize_name(name)
            superset = superset_group(name)
            percent_min, percent_max = parse_percent(percent)
            warmup_count = int(warmup) if re.match(r'^\d+$', warmup) else None
            working_count = int(working) if re.match(r'^\d+$', working) else None

            current_day['exercises'].append({
                'name': name,
                'normalizedName': norm,
                'supersetGroup': superset,
                'warmupSets': warmup,
                'workingSets': working,
                'warmupSetsCount': warmup_count,
                'workingSetsCount': working_count,
                'repsPlanned': reps,
                'load': load,
                'percentMin': percent_min,
                'percentMax': percent_max,
                'rpe': rpe,
                'rest': rest,
                'notes': notes,
                'primaryLift': primary_lift(norm),
            })

    if current_day and current_day['exercises']:
        current_week['days'].append(current_day)
    if current_week:
        current_week['days'] = [d for d in current_week['days'] if d['exercises']]
        weeks.append(current_week)

    return {'weeks': weeks}


def main():
    md = Path('powerbuilding_workouts_by_week.md').read_text(encoding='utf-8')
    program = build_program(md)
    print(json.dumps(program, indent=2))


if __name__ == '__main__':
    main()

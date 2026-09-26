import json
import os

transcript_path = r"C:\Users\krish_wq7qnor\.gemini\antigravity-ide\brain\cb7380da-7511-4411-8fe8-df7f00f34227\.system_generated\logs\transcript_full.jsonl"
target_dir = r"c:\Users\krish_wq7qnor\Downloads\New folder (9)\coalguard\backend\routes"
files_to_recover = {
    "auth.py": None,
    "inspections.py": None,
    "actions.py": None,
    "compliance.py": None,
    "dashboard.py": None,
    "admin.py": None
}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
            if entry.get("type") == "PLANNER_RESPONSE" and "tool_calls" in entry:
                for call in entry["tool_calls"]:
                    if call["function"] == "default_api:write_to_file" or call["function"] == "default_api:replace_file_content":
                        args_str = call.get("arguments", "{}")
                        try:
                            args = json.loads(args_str)
                            target = args.get("TargetFile", "")
                            if target:
                                target_norm = target.replace('\\', '/')
                                basename = os.path.basename(target_norm)
                                if basename in files_to_recover:
                                    if "CodeContent" in args:
                                        files_to_recover[basename] = args["CodeContent"]
                        except json.JSONDecodeError:
                            pass
        except Exception:
            pass

for fname, content in files_to_recover.items():
    if content:
        with open(os.path.join(target_dir, fname), 'w', encoding='utf-8') as f:
            f.write(content.replace("from ..", "from "))
        print(f"Recovered {fname}")
    else:
        print(f"Could not find {fname}")

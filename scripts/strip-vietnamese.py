import re
from pathlib import Path

path = Path(r"D:\botly\src\components\night-companion\NightCompanionFlow.tsx")
content = path.read_text(encoding="utf-8")

# 1. Remove vietnamese="..." props
cleaned = re.sub(r'\s*vietnamese="[^"]*"', '', content)
# 2. Remove vietnamese={...} props
cleaned = re.sub(r'\s*vietnamese=\{[^}]*\}', '', cleaned)
# 3. Remove vi: '...' in option arrays
cleaned = re.sub(r',\s*vi:\s*\'[^\']*\'', '', cleaned)

path.write_text(cleaned, encoding="utf-8")
print("Cleaned Vietnamese props from NightCompanionFlow.tsx successfully!")

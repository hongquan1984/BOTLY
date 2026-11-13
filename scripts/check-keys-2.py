txt = open('d:/botly/src/lib/healthclues-i18n.ts', encoding='utf-8').read()
for k in ['How to try it', 'Focus', 'Why this goal', 'Personal note:', 'Check-in']:
    print(k, '->', f'"{k}":' in txt)

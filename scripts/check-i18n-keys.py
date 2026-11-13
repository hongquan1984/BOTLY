txt = open('d:/botly/src/lib/healthclues-i18n.ts', encoding='utf-8').read()
keys = [
    'PRIVATE JOURNAL',
    'A moment with your companion',
    'Welcome back. This is optional, and you can skip it anytime.',
    'How did today feel?',
    'Pretty good',
    'A mixed day',
    'A little challenging',
    'Prefer not to answer',
    'Skip conversation',
    'Would you like to note anything about your journey today?',
    'Thanks for sharing. One more optional reflection.',
    'Would you like to reflect on your journey today?',
    'I explored something',
    'I took a rest day',
    'I did something my own way',
    'Companion reflection:',
    'Would you like to save that reflection?',
    'Your answers stay on this screen unless you add them to your private note.',
    'Continue without saving',
    'Add to private note',
    'Added to private note',
    'Choose a status only where you want to check in. No entry does not mean you skipped a tool.',
    'Opening your private check-in…',
    'Personal tool',
    'Tried / Used',
    'Not Yet',
    'Skipped',
    "Don't Remember",
    'Not Suitable',
    'Optional number of times (does not affect XP)',
    'Want to change this option?',
    'No time',
    'Too difficult',
    'Offer an alternative',
    'Your Toolkit is open. You can still make a private reflection today.',
    'Optional private note',
    'A small note for yourself…',
    'Private by default. Never appears in community sharing or reminder emails. A missed check-in does not imply anything about your care.',
    'Close check-in',
    'Check-in',
    'Daily Check-in',
    'View details',
    'Hide details',
    'Why this goal',
    'Personal note:'
]
missing = []
for k in keys:
    if f'"{k}":' not in txt:
        missing.append(k)
print('Missing keys count:', len(missing))
for m in missing:
    print(' -', m)

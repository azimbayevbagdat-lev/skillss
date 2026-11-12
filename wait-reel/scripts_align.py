import json,re,sys
words=[w for w in json.load(open('words_raw.json'))['words'] if w['type']=='word']
orig=[t for t in open('original.txt').read().split() if re.search(r'\w',t)]
# attach standalone dash to previous token
raw=open('original.txt').read().split(); orig=[]
for t in raw:
    if not re.search(r'\w',t): orig[-1]+=' '+t
    else: orig.append(t)
norm=lambda s: re.sub(r'[^\w]','',s.lower())
out=[];j=0
for o in orig:
    on=norm(o); w0=words[j]; acc=norm(w0['text']); k=j+1
    while acc!=on and k<len(words) and on.startswith(acc) and len(acc)<len(on):
        acc+=norm(words[k]['text']); k+=1
    if acc!=on: print('MISMATCH',o,'<-',[w['text'] for w in words[j:k]],file=sys.stderr)
    out.append({'text':o,'startMs':round(w0['start']*1000),'endMs':round(words[k-1]['end']*1000)})
    j=k
assert j==len(words),(j,len(words))
caps=[]
for i,c in enumerate(out):
    caps.append({'text':(' ' if i else '')+c['text'],'startMs':c['startMs'],'endMs':c['endMs'],'timestampMs':(c['startMs']+c['endMs'])//2,'confidence':None})
json.dump(caps,open('captions.json','w'),ensure_ascii=False,indent=1)
print(len(caps))

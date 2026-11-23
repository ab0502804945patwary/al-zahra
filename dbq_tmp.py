import json,os,sys,urllib.request
for l in open('.env.local',encoding='utf8'):
    if '=' in l:
        k,v=l.rstrip('\r\n').split('=',1); os.environ[k]=v
def q(sql):
    req=urllib.request.Request(f"https://api.supabase.com/v1/projects/{os.environ['SUPABASE_PROJECT_REF']}/database/query",data=json.dumps({"query":sql}).encode(),headers={"Authorization":"Bearer "+os.environ['SUPABASE_ACCESS_TOKEN'],"Content-Type":"application/json"})
    try: return json.loads(urllib.request.urlopen(req).read())
    except Exception as e: return str(e)+' '+e.read().decode()[:400]

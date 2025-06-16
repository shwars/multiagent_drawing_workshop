import os,json
for fn in os.listdir("."):
  if fn.endswith("_yart.png"):
    fn = fn[:-9]
    t = open(f"{fn}_explication.txt",encoding='utf-8').readlines()[0].strip().replace('*','')
    with open(f"{fn}.json",'w',encoding='utf-8') as f:
      json.dump({ "title" : t, "author" : "Dmitri Soshnikov", "concept" : fn },f,ensure_ascii=False)

import itertools, numpy as np, math
def rank2(M):
    M=M.copy()%2; r=0; rows,cols=M.shape
    for c in range(cols):
        p=[i for i in range(r,rows) if M[i,c]]
        if not p: continue
        M[[r,p[0]]]=M[[p[0],r]]
        for i in range(rows):
            if i!=r and M[i,c]: M[i]^=M[r]
        r+=1
        if r==rows: break
    return r
def betti(P,eps,maxd=3):
    n=len(P); D=[[math.dist(a,b) for b in P] for a in P]
    S=[[ (i,) for i in range(n)]]
    for k in range(2,maxd+2):
        S.append([c for c in itertools.combinations(range(n),k) if all(D[a][b]<=eps+1e-9 for a,b in itertools.combinations(c,2))])
    ranks=[0]
    for k in range(1,len(S)):
        idx={s:i for i,s in enumerate(S[k-1])}
        M=np.zeros((len(S[k-1]),len(S[k])),dtype=np.uint8)
        for j,s in enumerate(S[k]):
            for f in itertools.combinations(s,len(s)-1): M[idx[f],j]=1
        ranks.append(rank2(M) if M.size else 0)
    ranks.append(0)
    return [len(S[k])-ranks[k]-ranks[k+1] for k in range(maxd)]
def poly(n): return [(math.cos(2*math.pi*k/n)/(2*math.sin(math.pi/n)),math.sin(2*math.pi*k/n)/(2*math.sin(math.pi/n))) for k in range(n)]
for n,eps in [(4,[0.5,1,1.3,1.5]),(5,[0.5,1,1.5,1.7]),(6,[0.5,1,1.5,1.8,2.1])]:
    for e in eps: print(n,e,betti(poly(n),e))
print('cents sqrt2',1200*math.log2(math.sqrt(2)),'phi',1200*math.log2((1+5**.5)/2),'sqrt3',1200*math.log2(3**.5),'2',1200)

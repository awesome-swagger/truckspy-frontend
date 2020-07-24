def solution(S, X, Y):
    r = []
    length = len(X)
    
    for i in range(0, length):
        r[i] = {"index": i, "radius": pow(X[i], 2) + pow(Y[i], 2)}
        
    def sortKey(e):
        e.radius

    r.sort(key=sortKey)
    
    tags = []
    count = 0
    temp_count = 0
    
    for i in range(0, length):
        index = r[i]['index']
        letter = S[index]
        
        if (i != 0 and r[i - 1].radius != r[i].radius):
            count = i
        
        if (letter in tags):
            break
        
        tags.append(letter)
        temp_count+=1
        
    return temp_count if (temp_count == length) else count
let getLineCnt = function(sub){
    return 2;
};

let getLines = function(subs,i,n){
    let cnt = 0;
    let arr = [];
    while(i < subs.length){
        let sub = subs[i];
        cnt += getLineCnt(sub);
        if(cnt <= n){
            arr.push(sub);
            cnt += 1;// line in between
            i++;
        }else{
            break;
        }
    }
    return [arr,i];
};

/*
0 1 2 3 4
3.5
*/

let rectifyTime = function(tail1,arr2,ptr2){
    let idx = arr2.length-1;
    while(idx >= 0 && tail1.end <= arr2[idx].start){
        idx--;
    }
    idx++;
    let arr22 = arr2.slice(0,idx);
    return [arr22,ptr2-arr2.length+idx];
};


let splitSections = function(sub1,sub2){
    //sub1 = sub1.slice(0,30);
    //sub2 = sub2.slice(0,30);
    
    let maxlines = 36;
    let arr = [];
    let sub1ptr = 0;
    let sub2ptr = 0;
    while(sub1ptr < sub1.length && sub2ptr < sub2.length){
        let arr1;
        [arr1,sub1ptr] = getLines(sub1,sub1ptr,maxlines);
        let arr2;
        [arr2,sub2ptr] = getLines(sub2,sub2ptr,maxlines);
        //console.log(arr1.length,sub1ptr,arr2.length,sub2ptr);
        //console.log(arr2);
        //console.log(arr1,arr2);
        let tail1 = arr1[arr1.length-1];
        let tail2 = arr2[arr2.length-1];
        if(tail1.end < tail2.end){
            //arr2 longer
            [arr2,sub2ptr] = rectifyTime(tail1,arr2,sub2ptr);
        }else{
            //arr1 longer
            [arr1,sub1ptr] = rectifyTime(tail2,arr1,sub1ptr);
        }
        //console.log(arr1.length,arr2.length);
        arr.push([arr1,arr2]);
    }
    if(sub1ptr < sub1.length){
        arr.push([sub1.slice(sub1ptr),[]]);
    }else if(sub2ptr < sub2.length){
        arr.push([[],sub2.slice(sub2ptr)]);
    }
    return arr;
};


splieSections = function(sub1,sub2){
    sub1 = sub1.slice(0,30);
    sub2 = sub2.slice(0,30);
    let ptr1 = 0;
    let ptr2 = 0;
    let maxlinecnt = 30;
    while(ptr1 < sub1.length && ptr2 < sub2.length){
        let linecnt = 0;
        
    }
    if(ptr1 < sub1.length){
        arr.push([sub1.slice(ptr1),[]]);
    }else if(ptr2 < sub2.length){
        arr.push([[],sub2.slice(ptr2)]);
    }
    return arr;
}

module.exports = splitSections;